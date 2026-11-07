use std::fs;

fn main() {
    let contents = fs::read_to_string("code-lab/shared/numbers.txt")
        .unwrap_or_else(|_| String::from("1 2 3 4 5"));
    let numbers: Result<Vec<i64>, _> = contents.split_whitespace().map(str::parse).collect();
    let numbers = numbers.expect("Paylasilan sayilar tam sayi olmali");
    let total: i64 = numbers.iter().sum();
    println!("Merhaba Dimensia Rust!");
    println!("Toplam: {}", total);
    println!("DIMENSIA_RESULT:{{\"count\":{},\"sum\":{}}}", numbers.len(), total);
}
