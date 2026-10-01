# Turn on welcome emails (about 10 minutes, one time)

When this is set up, every song request:
- lands in a Google Sheet (one row per order, with a Status column you can update),
- emails you the full order (hit Reply to answer the customer),
- emails the customer a welcome from alejandro@ojedaworks.com: we got your story, price within 1 day, song in 2–5 days.

Demo signups get logged and receive a short welcome too.

## Steps

1. Sign in to Google as **alejandro@ojedaworks.com**. The emails send from whichever account does this.
2. Go to **sheets.new**. Name the sheet **My Own Hit Orders**.
3. In the sheet: **Extensions → Apps Script**.
4. Delete everything in the editor. Paste in all of `setup/Code.gs`. Click **Save** (disk icon).
5. Test it first: in the function dropdown at the top pick **testWelcome**, click **Run**.
   Google asks for permission. Click **Review permissions**, pick your account, then **Advanced → Go to project (unsafe) → Allow**.
   ("Unsafe" only means Google hasn't reviewed your own script. It's yours.)
   Check your inbox: you should get two welcome emails, English and Spanish.
6. **Deploy → New deployment**. Click the gear, choose **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   Click **Deploy**, then copy the **Web app URL** (ends in `/exec`).
7. Send that URL to Claude. It goes in `assets/site.js` as `APPS_SCRIPT_URL`.

## If you edit the email wording later
Change the text in `WELCOME` / `SIGNUP` inside Code.gs, then **Deploy → Manage deployments → pencil → Version: New version → Deploy**.
The URL stays the same.
