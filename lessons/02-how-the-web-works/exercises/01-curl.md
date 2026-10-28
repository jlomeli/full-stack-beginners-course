# curl and the Network tab

For each site, run the command, paste the whole output between the ```` ```text ```` fences, then fill in every blank under it. Write each answer next to its label.

## Site 1: a plain page

```sh
curl -sv https://example.com -o /dev/null
```

```text
paste the output here
```

- IP address and port curl connected to:
- The line that shows the TLS handshake finished:
- HTTP version used:
- Request line (method and path):
- The `Host` header, and why the server needs it:
- Status code, and what it means:
- `content-type`, and what it tells the browser:
- One header you didn't know, and what MDN says it does:

## Site 2: a redirect

Note the `http`, not `https`.

```sh
curl -sv http://github.com -o /dev/null
```

```text
paste the output here
```

- Port curl connected to, and why it differs from site 1:
- Status code and reason phrase:
- The header that says where to go next, and its value:
- Why GitHub sends this instead of the page:

Now run `curl -sIL http://github.com`.

- How many responses do you see?
- Status code of the last response:

## Site 3: a page that doesn't exist

Pick a site you use often. Request a path that doesn't exist on it:

```sh
curl -sv https://<your-site>/this-page-does-not-exist -o /dev/null
```

```text
paste the output here
```

- The site you picked:
- Status code:
- If it isn't `404`, why do you think the site answered that way?
- One response header that differs from site 1, and what it does:

## The Network tab

Open [developer.mozilla.org](https://developer.mozilla.org) with the Network tab open and **Disable cache** checked, then reload.

- Number of requests (from the bar at the bottom):
- Total transferred:
- Status code of the `document` request:
- Its `content-type` response header:
- Name, type, and status of one stylesheet or image request:
- The server's IP address for the `document` request (look for **Remote Address**):

Now uncheck **Disable cache** and reload twice.

- What changed in the **Size** column, and why:
