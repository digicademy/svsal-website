/* eslint-env worker */

let extractorPromise = null
let loadedModelId = null
let loadedDevice = 'wasm'

const TRANSFORMERS_JS_URL = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2'
const DEFAULT_MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'

self.onmessage = async function (event) {
  const payload = event.data || {}
  if (payload.type !== 'rerank') return

  const messageId = payload.messageId
  const startedAt = performance.now()

  try {
    const settings = payload.settings || {}
    const modelId = settings.model || DEFAULT_MODEL
    const candidates = Array.isArray(payload.candidates) ? payload.candidates : []

    const modelStart = performance.now()
    const extractor = await getExtractor(modelId, settings.preferWebGPU !== false)
    const modelMs = performance.now() - modelStart

    const queryStart = performance.now()
    const queryEncoded = await encodeWithTokens(extractor, payload.queryText || '', {
      maxLength: settings.maxQueryTokens || 320,
      isQuery: true
    })
    const queryMs = performance.now() - queryStart

    const scoreStart = performance.now()
    const results = []

    for (const candidate of candidates) {
      const encodedDoc = await encodeWithTokens(extractor, candidate.text || '', {
        maxLength: settings.maxDocTokens || 240,
        poolFactor: settings.docPoolFactor || 1,
        isQuery: false
      })

      const scored = computeMaxSim(queryEncoded, encodedDoc)
      results.push({
        id: candidate.id,
        initial_rank: candidate.initial_rank,
        score: scored.score,
        confidence: scored.confidence,
        explainability: scored.explainability
      })
    }

    results.sort((a, b) => b.score - a.score)
    results.forEach((item, idx) => {
      item.rerank_rank = idx + 1
    })

    const scoreMs = performance.now() - scoreStart

    self.postMessage({
      type: 'rerank_result',
      messageId,
      ok: true,
      model: modelId,
      device: loadedDevice,
      results,
      telemetry: {
        model_ms: Math.round(modelMs),
        query_ms: Math.round(queryMs),
        score_ms: Math.round(scoreMs),
        total_ms: Math.round(performance.now() - startedAt),
        candidate_count: candidates.length
      }
    })
  } catch (error) {
    self.postMessage({
      type: 'rerank_result',
      messageId,
      ok: false,
      error: error && error.message ? error.message : String(error)
    })
  }
}

async function getExtractor (modelId, preferWebGPU) {
  if (extractorPromise && loadedModelId === modelId) {
    return extractorPromise
  }

  loadedModelId = modelId
  extractorPromise = createExtractor(modelId, preferWebGPU)
  return extractorPromise
}

async function createExtractor (modelId, preferWebGPU) {
  const mod = await import(TRANSFORMERS_JS_URL)
  const { pipeline, env } = mod

  env.allowLocalModels = false

  if (preferWebGPU) {
    try {
      const webgpuExtractor = await pipeline('feature-extraction', modelId, { device: 'webgpu' })
      loadedDevice = 'webgpu'
      return webgpuExtractor
    } catch (e) {
      // fall through to wasm
    }
  }

  const wasmExtractor = await pipeline('feature-extraction', modelId, { device: 'wasm' })
  loadedDevice = 'wasm'
  return wasmExtractor
}

async function encodeWithTokens (extractor, text, options = {}) {
  const maxLength = options.maxLength || 256

  const embeddingOutput = await extractor(text, {
    pooling: 'none',
    normalize: true,
    truncation: true,
    max_length: maxLength
  })

  const vectors = toTokenVectors(embeddingOutput)
  const tokenIds = await getTokenIds(extractor, text, maxLength)
  const tokens = tokenIds.map((id) => ({
    id,
    token: normalizeTokenString(decodeToken(extractor, id))
  }))

  const aligned = alignTokensAndVectors(tokens, vectors)
  const pooled = options.poolFactor > 1 && !options.isQuery
    ? poolDocumentTokens(aligned.tokens, aligned.vectors, options.poolFactor)
    : aligned

  return pooled
}

async function getTokenIds (extractor, text, maxLength) {
  const tokenizer = extractor.tokenizer
  if (!tokenizer) return []

  const encoded = await tokenizer(text, {
    truncation: true,
    max_length: maxLength,
    padding: false
  })

  const ids = Array.isArray(encoded.input_ids) ? encoded.input_ids : []
  if (ids.length > 0 && Array.isArray(ids[0])) return ids[0]
  return ids
}

function decodeToken (extractor, id) {
  const tokenizer = extractor.tokenizer
  if (!tokenizer) return String(id)

  try {
    if (tokenizer.model && typeof tokenizer.model.convert_ids_to_tokens === 'function') {
      return tokenizer.model.convert_ids_to_tokens([id])[0]
    }
  } catch (e) {}

  try {
    if (typeof tokenizer.convert_ids_to_tokens === 'function') {
      return tokenizer.convert_ids_to_tokens([id])[0]
    }
  } catch (e) {}

  try {
    return tokenizer.decode([id], { skip_special_tokens: false })
  } catch (e) {
    return String(id)
  }
}

function normalizeTokenString (token) {
  return String(token || '')
    .replace(/^##/, '')
    .replace(/^▁/, '')
    .replace(/^Ġ/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function alignTokensAndVectors (tokens, vectors) {
  const len = Math.min(tokens.length, vectors.length)
  return {
    tokens: tokens.slice(0, len),
    vectors: vectors.slice(0, len)
  }
}

function toTokenVectors (embeddingOutput) {
  if (embeddingOutput && typeof embeddingOutput.tolist === 'function') {
    const arr = embeddingOutput.tolist()
    if (Array.isArray(arr) && Array.isArray(arr[0]) && Array.isArray(arr[0][0])) {
      return arr[0]
    }
    if (Array.isArray(arr) && Array.isArray(arr[0])) {
      return arr
    }
  }

  if (embeddingOutput && embeddingOutput.data && embeddingOutput.dims && embeddingOutput.dims.length >= 3) {
    const dims = embeddingOutput.dims
    const seqLen = dims[dims.length - 2]
    const hidden = dims[dims.length - 1]
    const vectors = []
    for (let i = 0; i < seqLen; i++) {
      const start = i * hidden
      const end = start + hidden
      vectors.push(Array.from(embeddingOutput.data.slice(start, end)))
    }
    return vectors
  }

  return []
}

function poolDocumentTokens (tokens, vectors, factor) {
  if (!factor || factor <= 1) {
    return { tokens, vectors }
  }

  const pooledTokens = []
  const pooledVectors = []

  for (let i = 0; i < vectors.length; i += factor) {
    const chunkVectors = vectors.slice(i, i + factor)
    const chunkTokens = tokens.slice(i, i + factor)
    if (chunkVectors.length === 0) continue

    const summed = new Array(chunkVectors[0].length).fill(0)
    for (const vector of chunkVectors) {
      for (let j = 0; j < vector.length; j++) {
        summed[j] += vector[j]
      }
    }

    for (let j = 0; j < summed.length; j++) {
      summed[j] = summed[j] / chunkVectors.length
    }

    pooledVectors.push(l2Normalize(summed))
    pooledTokens.push({
      id: chunkTokens[0] ? chunkTokens[0].id : -1,
      token: chunkTokens
        .map(t => t.token)
        .filter(Boolean)
        .slice(0, 2)
        .join(' ')
    })
  }

  return { tokens: pooledTokens, vectors: pooledVectors }
}

function l2Normalize (vector) {
  let norm = 0
  for (let i = 0; i < vector.length; i++) norm += vector[i] * vector[i]
  norm = Math.sqrt(norm) || 1
  return vector.map(v => v / norm)
}

function computeMaxSim (queryEncoded, docEncoded) {
  const qVectors = queryEncoded.vectors
  const dVectors = docEncoded.vectors
  const qTokens = queryEncoded.tokens
  const dTokens = docEncoded.tokens

  const docContrib = new Array(dVectors.length).fill(0)
  const docMatchedBy = dVectors.map(() => [])
  const queryRows = []

  let score = 0

  for (let qi = 0; qi < qVectors.length; qi++) {
    let bestSim = -Infinity
    let bestDocIndex = -1
    for (let di = 0; di < dVectors.length; di++) {
      const sim = dot(qVectors[qi], dVectors[di])
      if (sim > bestSim) {
        bestSim = sim
        bestDocIndex = di
      }
    }

    if (bestDocIndex >= 0) {
      score += bestSim
      docContrib[bestDocIndex] += bestSim
      docMatchedBy[bestDocIndex].push(qi)
    }

    const token = qTokens[qi] ? qTokens[qi].token : ''
    queryRows.push({
      index: qi,
      token,
      best_doc_token_index: bestDocIndex,
      best_doc_token: bestDocIndex >= 0 && dTokens[bestDocIndex] ? dTokens[bestDocIndex].token : '',
      contribution: Number.isFinite(bestSim) ? bestSim : 0,
      is_special: isSpecialToken(token),
      is_punctuation: isPunctuationToken(token)
    })
  }

  const positiveDen = queryRows.reduce((sum, row) => sum + Math.max(0, row.contribution), 0) || 1
  queryRows.forEach(row => {
    row.share = Math.max(0, row.contribution) / positiveDen
  })

  const docRows = dTokens.map((tokenObj, di) => ({
    index: di,
    token: tokenObj ? tokenObj.token : '',
    contribution: docContrib[di],
    share: 0,
    matched_by: docMatchedBy[di],
    is_special: isSpecialToken(tokenObj ? tokenObj.token : ''),
    is_punctuation: isPunctuationToken(tokenObj ? tokenObj.token : '')
  }))

  const docPositiveDen = docRows.reduce((sum, row) => sum + Math.max(0, row.contribution), 0) || 1
  docRows.forEach(row => {
    row.share = Math.max(0, row.contribution) / docPositiveDen
  })

  const visibleLinks = queryRows
    .filter(row => !row.is_special && !row.is_punctuation && row.best_doc_token_index >= 0)
    .sort((a, b) => b.share - a.share)
    .map(row => ({
      query_index: row.index,
      doc_index: row.best_doc_token_index,
      share: row.share,
      contribution: row.contribution
    }))

  const confidenceDen = queryRows.filter(row => !row.is_special).length || 1

  return {
    score,
    confidence: score / confidenceDen,
    explainability: {
      query_tokens: queryRows,
      doc_tokens: docRows,
      links: visibleLinks,
      visible_query_token_count: queryRows.filter(row => !row.is_special && !row.is_punctuation).length
    }
  }
}

function dot (a, b) {
  const len = Math.min(a.length, b.length)
  let sum = 0
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i]
  }
  return sum
}

function isSpecialToken (token) {
  const t = String(token || '')
  if (!t) return true
  return /^\[.*\]$/.test(t) || /^<.*>$/.test(t)
}

function isPunctuationToken (token) {
  const t = String(token || '').trim()
  if (!t) return true
  return /^[\p{P}\p{S}]+$/u.test(t)
}
