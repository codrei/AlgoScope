def power(x, n):
    # divide and conquer: x^n = (x^(n/2))^2, times x once more if n is odd
    if n == 0:
        return 1
    half = power(x, n // 2)
    if n % 2 == 0:
        return half * half
    return half * half * x


print("2^10 =", power(2, 10))
print("3^5 =", power(3, 5))
