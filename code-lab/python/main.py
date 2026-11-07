"""Dimensia Python example: works on CPython or Pyodide."""
def calculate(numbers):
    return sum(numbers)

if __name__ == "__main__":
    print("Merhaba Dimensia!")
    print("Toplam:", calculate([1, 2, 3, 4, 5]))
