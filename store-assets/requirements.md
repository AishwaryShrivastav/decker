# Remaining human steps to submit

Everything in this folder is ready. The steps below need the owner's Google
account and a payment card; none of them can be automated.

1. **Register a Chrome Web Store developer account.** Go to
   https://chrome.google.com/webstore/devconsole, sign in with the Google
   account that should own the listing, accept the developer agreement, and pay
   the one-time $5 registration fee. Google requires a verified email and
   two-step verification on the account.

2. **Create the item and upload the zip.** In the developer console, click
   "New item" and upload `store-assets/decker-chrome.zip`. The title
   ("Decker: Google Meet Notes, Decks & AI") and the 122-character summary are
   read from the manifest inside the zip.

3. **Fill the store listing tab.** Paste the full description from
   `store-assets/listing.md`. Set category to Productivity > Workflow &
   Planning and language to English. Set homepage URL
   (https://decker.techforgood.studio) and support URL
   (https://github.com/AishwaryShrivastav/decker/issues).

4. **Upload screenshots.** Add the three 1280x800 PNGs from
   `store-assets/screenshots/` in numbered order. The 128px icon is taken from
   the manifest automatically.

5. **Fill the privacy practices tab.** Single purpose: "Record the active
   Google Meet tab and generate a meeting deliverable (deck, brief, prototype,
   or site) from the transcript." Justify each permission using
   `store-assets/privacy.md` (tabCapture, tabs, storage, activeTab, offscreen,
   downloads, and the two host permissions). For data usage, declare that no
   user data is collected by the developer; audio and text go directly to
   OpenAI with the user's own key. Privacy policy URL:
   https://decker.techforgood.studio/privacy.

6. **Set distribution and submit.** Visibility: public. Price: free. Click
   "Submit for review". First reviews of extensions with tabCapture and broad
   host permissions commonly take several days; respond to any reviewer email
   from the same account.

7. **After approval, wire up the funnel.** Put the real listing URL into the
   site's `CHROME` constant (`apps/web/app/page.tsx`) and the README install
   section, replacing the generic chrome.google.com/webstore links, then
   redeploy the site.

The only blocker outside this list is the $5 developer account itself.
