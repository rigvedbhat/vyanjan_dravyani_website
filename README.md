# Vyanjan Dravyani

Mobile-first website for a homemade Maharashtrian masala brand, built from the Google Stitch visual direction.

## Setup

1. Install dependencies with `npm.cmd install`.
2. Copy `.env.example` to `.env.local`.
3. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a long random `ADMIN_SESSION_SECRET`.
4. Run `npm.cmd run dev`.

## Content

Products are managed in `data/products.json`. Images are loaded from `public/assets`, so new product photos can be dropped into:

- `public/assets/products/{product-slug}/`
- `public/assets/use-cases/{product-slug}/`
- `public/assets/hero/`
- `public/assets/branding/`

The admin dashboard at `/admin` can add, edit, hide, delete, and reorder product content and images.
