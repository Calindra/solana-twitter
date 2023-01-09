use cartesi_solana::executor::create_executor;
use solana_twitter::entry;

pub(crate) use std::io;

fn main() -> io::Result<()> {
    let mut executor = create_executor();
    executor.get_processor_args(|program_id, accounts, data| {
        entry(&program_id, accounts, &data).unwrap();
    });
    Ok(())
}
