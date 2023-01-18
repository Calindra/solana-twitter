
set -e
rm -rf ./target
cd ./programs/solana-twitter && cargo build -Z build-std=std,core,alloc,panic_abort,proc_macro --target ../../riscv64ima-cartesi-linux-gnu.json --release

cd -
cp ./target/riscv64ima-cartesi-linux-gnu/release/solana-twitter /rollups-examples/solana-adapter/solana_programs_riscv/DEVemLxXHPz1tbnBbTVXtvNBHupP2RCBw1jTFN8Uz3FD

cargo clean

echo "done."