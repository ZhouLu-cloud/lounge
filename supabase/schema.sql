create extension if not exists pgcrypto;

create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique,
  name text not null,
  game_type text not null check (game_type in ('POKER', 'DICE', 'LADY_CARDS')),
  players int not null default 0,
  max_players int not null default 9,
  min_buy_in int,
  stakes text,
  status text not null default 'active' check (status in ('active', 'full', 'waiting')),
  chinese_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.dice_rolls (
  id uuid primary key default gen_random_uuid(),
  player_name text not null default 'Guest',
  dice_count int not null check (dice_count between 1 and 10),
  results int[] not null,
  total int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.poker_hands (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  player_name text not null default 'Guest',
  player_cards jsonb not null,
  all_community_cards jsonb not null,
  community_cards jsonb not null,
  reveal_stage int not null default 0 check (reveal_stage between 0 and 3),
  created_at timestamptz not null default now()
);

create table if not exists public.lady_cards_draws (
  id uuid primary key default gen_random_uuid(),
  player_name text not null default 'Guest',
  card_value text not null,
  suit_name text not null,
  suit_icon text not null,
  suit_color text not null,
  card_name text not null,
  rule_text text not null,
  rule_icon text not null,
  created_at timestamptz not null default now()
);

insert into public.game_rooms (room_code, name, game_type, players, max_players, stakes, min_buy_in, status)
values
  ('9901', 'Royal Flush Lounge', 'POKER', 6, 9, '50 / 100', 5000, 'active'),
  ('9902', 'Midnight Blue', 'POKER', 4, 9, '10 / 20', 400, 'active'),
  ('9903', 'Velvet Lounge', 'POKER', 7, 9, '25 / 50', 1000, 'active')
on conflict (room_code) do nothing;

insert into public.game_rooms (room_code, name, game_type, players, max_players, status, chinese_name)
values
  ('8801', 'High Stakes Table', 'DICE', 5, 8, 'active', '摇骰子'),
  ('7701', 'Lady Cards', 'LADY_CARDS', 2, 4, 'active', '小姐牌')
on conflict (room_code) do nothing;
