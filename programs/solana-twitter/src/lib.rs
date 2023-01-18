use anchor_lang::prelude::*;
use anchor_lang::{self, solana_program::system_program};
use anchor_spl::token::TokenAccount;
use std::mem::size_of;

declare_id!("DEVemLxXHPz1tbnBbTVXtvNBHupP2RCBw1jTFN8Uz3FD");

#[program]
pub mod solana_twitter {
    use super::*;
    pub fn send_tweet(
        ctx: Context<SendTweet>,
        topic: String,
        content: String,
        _user_tweet_id: String,
    ) -> Result<()> {
        let tweet: &mut Account<Tweet> = &mut ctx.accounts.tweet;
        let author: &Signer = &ctx.accounts.author;
        let clock: Clock = Clock::get().unwrap();

        if topic.chars().count() > 50 {
            return Err(ErrorCode::TopicTooLong.into());
        }

        if content.chars().count() > 280 {
            return Err(ErrorCode::ContentTooLong.into());
        }

        tweet.author = *author.key;
        tweet.timestamp = clock.unix_timestamp;
        tweet.topic = topic;
        tweet.content = content;

        Ok(())
    }

    pub fn update_tweet(ctx: Context<UpdateTweet>, topic: String, content: String) -> Result<()> {
        let tweet: &mut Account<Tweet> = &mut ctx.accounts.tweet;

        if topic.chars().count() > 50 {
            return Err(ErrorCode::TopicTooLong.into());
        }

        if content.chars().count() > 280 {
            return Err(ErrorCode::ContentTooLong.into());
        }
        if tweet.author.key() != ctx.accounts.author.key() {
            return Err(ErrorCode::Forbidden.into());
        }
        tweet.topic = topic;
        tweet.content = content;

        Ok(())
    }

    pub fn delete_tweet(ctx: Context<DeleteTweet>) -> Result<()> {
        if ctx.accounts.tweet.author.key() != ctx.accounts.author.key() {
            return Err(ErrorCode::Forbidden.into());
        }
        Ok(())
    }

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.user.pfp = ctx.accounts.token_account.mint;
        ctx.accounts.user.owner = ctx.accounts.owner.key();

        Ok(())
    }

    pub fn update(ctx: Context<UpdateUser>) -> Result<()> {
        if ctx.accounts.owner.key() != ctx.accounts.user.owner {
            return Err(ErrorCode::Forbidden.into());
        }

        ctx.accounts.user.pfp = ctx.accounts.token_account.mint;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(topic: String, content: String, user_tweet_id: String)]
pub struct SendTweet<'info> {
    #[account(init, payer = author, space = Tweet::LEN,
        seeds=[
            author.key().as_ref(),
            &user_tweet_id.as_bytes(),
        ],
        bump,
    )]
    pub tweet: Account<'info, Tweet>,
    #[account(mut)]
    pub author: Signer<'info>,

    /// CHECK: no problem at all
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct UpdateTweet<'info> {
    #[account(mut, has_one = author)]
    pub tweet: Account<'info, Tweet>,
    pub author: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeleteTweet<'info> {
    #[account(mut, has_one = author, close = author)]
    pub tweet: Account<'info, Tweet>,
    pub author: Signer<'info>,
}

#[account]
pub struct Tweet {
    pub author: Pubkey,
    pub timestamp: i64,
    pub topic: String,
    pub content: String,
}

#[account]
#[derive(Default)]
pub struct User {
    pfp: Pubkey,
    pub owner: Pubkey,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, seeds = [b"user", owner.key().as_ref()], bump, space = 8 + size_of::<User>())]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub owner: Signer<'info>,
    system_program: Program<'info, System>,
    #[account(
        constraint = user.pfp != token_account.mint,
        has_one = owner
    )]
    pub token_account: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct UpdateUser<'info> {
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub owner: Signer<'info>,
    system_program: Program<'info, System>,
    pub token_account: Account<'info, TokenAccount>,
}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_TOPIC_LENGTH: usize = 50 * 4; // 50 chars max.
const MAX_CONTENT_LENGTH: usize = 280 * 4; // 280 chars max.

impl Tweet {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Author.
        + TIMESTAMP_LENGTH // Timestamp.
        + STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH // Topic.
        + STRING_LENGTH_PREFIX + MAX_CONTENT_LENGTH; // Content.
}

#[error_code]
pub enum ErrorCode {
    #[msg("The provided topic should be 50 characters long maximum.")]
    TopicTooLong,
    #[msg("The provided content should be 280 characters long maximum.")]
    ContentTooLong,
    #[msg("Forbidden")]
    Forbidden,
}
