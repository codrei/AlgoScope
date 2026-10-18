def gcd(a, b):
    # Euclid: gcd(a, b) = gcd(b, a % b), until the remainder is 0
    while b != 0:
        r = a % b
        print(a, "=", a // b, "x", b, "+", r)
        a = b
        b = r
    return a


result = gcd(252, 105)
print("GCD =", result)
