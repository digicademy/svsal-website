# Filter output of journalctl -f to not display failed login attempts
# except for existing users.

{ service=$5 ; $4="" } 

# get the non sshd stuff out the way
service !~ /^sshd\[[0-9]*\]:$/ { print ; next; }

# show authentication errors for valid users which are not root
/authentication failure/ && $15 != "" && $15 != "user=root" { print; next; }
/Failed password for/ && !/invalid user/ && !/for root/ { print; next; }

# Show valid logins
/Connection closed by authenticating user/ { print; next; }
/Accepted publickey/ { print; next; }
/pam_unix\(sshd:session):/ { print; next; }
