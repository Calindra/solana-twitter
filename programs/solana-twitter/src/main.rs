use std::io;

use cartesi_solana::executor::create_executor;
use solana_twitter::entry;

fn main() -> io::Result<()> {
    let mut executor = create_executor();
    executor.get_processor_args(|program_id, accounts, data| {
        entry(&program_id, &accounts, &data).unwrap();
    });
    Ok(())
}
