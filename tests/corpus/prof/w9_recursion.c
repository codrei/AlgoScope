#include <stdio.h>

void Test(int n)
{
    if (n > 0)
    {
        printf("%d ", n);
        Test(n - 1);
    }
}

int factorial(int n)
{
    if (n == 1)
        return 1;
    else
        return n * factorial(n - 1);
}

int main()
{
    int n, i, fact = 1, res;
    scanf("%d", &n);
    for (i = 1; i <= n; i++)
        fact = fact * i;
    printf("factorial is: %d\n", fact);
    res = factorial(n);
    printf("factorial is: %d\n", res);
    Test(3);
    printf("\n");
    return 0;
}
