function isPrime(number) {
	for (var div = 2; div < number/2; div++) {
		if ((number % div) == 0) {
			return false;
		}
	}
	return true;
}
var is243Prime = isPrime(243);
console.log('Is 243 prime? ' + is243Prime);      

function fibonacci(n) {
	if (n == 0 || n == 1) {
		return n;
	}
	return fibonacci(n - 1) + fibonacci(n - 2);
}
var fib10 = fibonacci(10);
console.log('10th fibonacci ' + fib10);
