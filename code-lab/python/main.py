"""Dimensia Polyglot: shared input contract, Python 3 or Pyodide fallback."""
from pathlib import Path
import json

def main():
    path = Path("code-lab/shared/numbers.txt")
    numbers = [int(x) for x in path.read_text().split()] if path.exists() else [1, 2, 3, 4, 5]
    total = sum(numbers)
    print("Merhaba Dimensia Python!")
    print("Toplam:", total)
    print("DIMENSIA_RESULT:" + json.dumps({"count": len(numbers), "sum": total}))

if __name__ == "__main__":
    main()
