import hashlib

password = "hotel123"
hash_result = hashlib.sha256(password.encode()).hexdigest()
print(hash_result)
