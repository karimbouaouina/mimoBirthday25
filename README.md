# Birthday Arcade

A static 8-bit birthday surprise site.

Flow:

1. Opening slot machine gate.
2. She spins until the reels land on `25 / 25 / 25`.
3. The page says `HAPPY BIRTHDAY` and opens a cute arcade room.
4. She explores cabinets to unlock love letters, coupons, a playable Stitch plushie claw machine, Heart Catch, Whack-a-Heart, a birthday Photo Booth, memories, and a final prize vault.

The arcade room is wider than the screen. Use the left/right arrow buttons, or keyboard `A` / `D` and arrow keys, to walk the character through the room.

Coupons are redeemed with tickets earned from games. Opening the coupon booth no longer grants the coupon reward by itself; she has to spend tickets on a coupon.

## Camera Note

The Photo Booth uses the browser camera API. It will work on HTTPS after deploying to Vercel, and on localhost while testing. The photo is created in the browser and downloaded locally; it is not uploaded anywhere.

## Personalize

Edit `script.js`:

- `birthdayName`
- `letters`
- `coupons`
- final prize copy inside `finalView()`

Edit `index.html` if you want to replace `Player 2` in the room heading with her name or nickname.

## Deploy on Vercel

This is a static site. In Vercel, import this folder and keep the defaults:

- Framework preset: `Other`
- Build command: leave empty
- Output directory: `.`

No dependencies are required.
