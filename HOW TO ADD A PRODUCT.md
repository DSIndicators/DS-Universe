# Adding a product to the site (either vault)

Since 2026-11-01 the site's catalogue is generated from the business workbooks, so adding a product is three steps
and two double-clicks. Nothing on the site is typed by hand for a new product.

## 1. The product's rows (once per product)

In `DS Master Folder\00 Business Documents\DS Universe - Master Product & Pricing Sheet.xlsx`, give the product a row
on each product tab, **in the section of the vault it belongs to**:

| Section on the sheet | Vault on the site | Its page |
|---|---|---|
| ON THE PRICE CHART / IN A PANEL OF THEIR OWN / ADD-ONS | DS Essentials Vault (that group) | `/essentials/<slug>` |
| FREE VAULT | DS Free Vault | `/free-vault/<slug>` |

What the site reads from it:

| Tab | Columns |
|---|---|
| Product Catalog | Type, Category, Purpose (the one line in lists), Hook 1-4 (the ticks on its page) |
| Product Details | How It Helps Traders ("What it is for"), Full Description ("How it works, in full") |
| Markets | What It Reads |
| NT8 Listings | Cover Line (the line under its name; without one the page shows Hook 1) |

The version shown on the site comes from `DS Universe - Patch Notes & Versions.xlsx` (Current Versions), so the
product needs its row there too (Lists tab first, then Current Versions and a Releases row).

The web address is the name without "DS ", in lower case with hyphens (`DS HTF PO3` -> `htf-po3`), unless
`content/catalog/site.json` "slugs" says otherwise.

## 2. Its cover

Put the picture at `DS Master Folder\<Product>\<Product>.png` (for example `DS Master Folder\DS HTF PO3\DS HTF PO3.png`).
It is copied byte for byte - never resized, cropped or recoloured - with 360 and 720 px copies made for the tiles.
Replace that file and run step 3 again to change the cover. Give it a description for screen readers in
`content/covers.ts` (PICTURE_ALTS, keyed by the file name); without one it reads "<Product> in NinjaTrader 8."

## 3. Double-click `ADD OR UPDATE A PRODUCT (site).bat` (in the Command Center)

It reads both workbooks (read only), updates `content/products.ts`, `content/pointers.ts` and the covers, prints
every product with its vault, version, cover and download state and what changed, asks for a Whop checkout link
(Enter skips), then builds the preview on http://localhost:3003. Look at the product there.

Then double-click **`PUBLISH THE SITE TO DSUNIVERSE.NET.bat`**: it builds, shows the files that will change and pushes
only after you type `PUBLISH`.

## The Free Vault download

A Free Vault tool with no Whop checkout yet shows "Opening soon" where Download would be, so a new tool can go on the
site before its Whop product exists. When the Whop product is made, run the .bat again and paste the checkout link at
step 3 (or `node tools/catalog/whop.mjs <slug> <checkout link> [listing link]`). Essentials Vault tools have no link of
their own: they come with the membership.

## "New" and the Free Vault return

- `content/catalog/site.json` "markNew": the tools that wear **New** on the shelves, in the vault and on their page.
  Remove a slug when it is no longer new.
- `content/returns.ts`: "The Free Vault is back" (the line above the header, the Free Vault page's opening, the home
  page's Free Vault card and row, the members' Free Vault). It switches itself off on `until`.

## Checks

- `node tools/catalog/sync.mjs --check` changes nothing and says what would change (exit 1 if anything would).
- The build refuses a product page for a product that is not in the catalogue, a retired Whop link, and two buttons
  sharing one checkout (`content/store.ts`).
