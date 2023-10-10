<?php
/**
 * Forms Validation.
 *
 * @package SimpleShareButtonsAdder
 */

namespace SimpleShareButtonsAdder;

/**
 * Forms Validation Class
 *
 * @package SimpleShareButtonsAdder
 */
class Forms_Validation {
	/**
	 * Input validation.
	 *
	 * @return array
	 */
	public function allowed_input_fields() {
		return array(
			'button'   => array(
				'class'  => array(),
				'data-*' => array(),
				'id'     => array(),
				'type'   => array(),
			),
			'div'      => array(
				'class' => array(),
			),
			'label'    => array(),
			'input'    => array(
				'class'       => array(),
				'checked'     => array(),
				'disabled'    => array(),
				'id'          => array(),
				'name'        => array(),
				'placeholder' => array(),
				'type'        => array(),
				'value'       => array(),
			),
			'option'   => array(
				'selected' => array(),
				'value'    => array(),
			),
			'p'        => array(
				'class' => array(),
			),
			'select'   => array(
				'class' => array(),
				'id'    => array(),
				'name'  => array(),
			),
			'textarea' => array(
				'class' => array(),
				'id'    => array(),
				'name'  => array(),
				'rows'  => array(),
			),
			'span'     => array(
				'class' => array(),
			),
		);
	}
}
