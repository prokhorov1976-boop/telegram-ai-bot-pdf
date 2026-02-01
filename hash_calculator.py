import hashlib
password = "@As318777"
hash_result = hashlib.sha256(password.encode()).hexdigest()
print(hash_result)
