# 02. How the web works

In this lesson you follow one web page from the URL you type to the page on your screen. You capture real HTTP traffic with `curl` and the browser's Network tab, annotate it, and finish with a quiz on HTTP status codes.

## What you will be able to do

- Trace a request from URL to rendered page: DNS, TCP, HTTP, HTML
- Read requests and responses in the browser Network tab
- Name the common HTTP methods and status codes

## Before you start

Create your branch from an up-to-date `main`:

```sh
git switch main
git pull
git switch -c lesson-02
```

This lesson has no automated tests. You fill in two Markdown files in `exercises/`, and your reviewer reads them. `npm test 02` finds no test files and exits without an error, so the **Lesson checks** on your PR pass as soon as you push.

## The parts of a URL

Every page starts with a URL. Here is one with every part filled in:

```
https://www.example.com:443/docs/page.html?lang=en#install
└─┬─┘   └──────┬──────┘ └┬┘└──────┬──────┘ └──┬──┘ └──┬──┘
scheme       host      port     path       query  fragment
```

- The **scheme** says how to talk to the server. `https` is HTTP over an encrypted connection.
- The **host** names the server.
- The **port** picks a program on that server. You rarely see it, because `https` uses 443 and `http` uses 80 unless the URL says otherwise.
- The **path** names the thing you want on that server.
- The **query** passes extra options, as `name=value` pairs joined by `&`.
- The **fragment** points at a spot inside the page. The browser keeps it and never sends it to the server.

Try it. Search for anything on [developer.mozilla.org](https://developer.mozilla.org) and look at the address bar. Find the path and the query. Which part holds the words you searched for?

## Step 1: DNS turns the host name into an address

Computers on the internet find each other by **IP address**, a number like `104.20.23.154`. Names like `example.com` are for people. Before the browser can connect, it asks the **Domain Name System (DNS)** for the address that belongs to the name.

Ask DNS yourself:

```sh
nslookup example.com
```

You see a few lines that start with `Address:`. Those are the IP addresses of the servers behind `example.com`. Big sites return several, so traffic spreads across many machines. Your numbers may differ from your classmates'. That's normal.

The browser and your operating system remember these answers for a while, so a second visit skips this step.

## Step 2: TCP opens a connection

With an IP address in hand, the browser opens a **TCP connection** to that address on the port from the URL. TCP is the layer that makes sure every byte arrives, in order, and resends anything that gets lost. Once the connection is open, both sides can send data back and forth.

For an `https` URL, the browser and server then do a **TLS handshake**. They agree on encryption keys, and the server proves it really is `example.com` with a certificate. After the handshake, nobody between you and the server can read or change the traffic.

The browser keeps the connection open and reuses it for the next requests to the same server.

## Step 3: HTTP asks for the page

Now the browser sends an **HTTP request**. HTTP is plain text with a strict layout. A request looks like this:

```
GET /docs/page.html HTTP/1.1
Host: www.example.com
User-Agent: Mozilla/5.0 ...
Accept: text/html

```

- The first line is the **request line**: a method (`GET`), a path, and the HTTP version.
- Every other line is a **header**: a name, a colon, and a value. Headers carry extra information. `Host` says which site you want, because one server often hosts many sites.
- A blank line ends the headers. Some requests, such as a form submission, send a **body** after it.

The server sends back an **HTTP response** with the same layout:

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 1256

<!doctype html>
<html lang="en">
...
```

- The first line is the **status line**: the version, a three-digit **status code**, and a short reason (`OK`).
- The headers describe the body. `Content-Type` says what kind of data it is. `Content-Length` says how many bytes it has.
- After the blank line comes the body: here, the HTML of the page.

Most sites today speak **HTTP/2**. It sends the same methods, headers, and status codes in a faster binary format. Tools print it in the same text layout, with two differences you'll notice: header names are lowercase, and the status line has no reason phrase (`HTTP/2 200`).

## Step 4: The browser turns HTML into a page

The browser reads the HTML from top to bottom and builds the page. When it finds a tag that points at another file, such as a stylesheet, an image, or a script, it sends another request for that file. A typical page makes dozens of requests. Each one goes through the same steps, but DNS answers and connections are reused, so the later ones are fast.

When the browser has the HTML and the CSS, it works out where every box goes and paints the pixels. You write HTML in lesson 03 and CSS in lessons 04 and 05.

Here is the whole trip, start to finish:

```
you type https://example.com/
  → DNS: example.com is 104.20.23.154
  → TCP: connect to 104.20.23.154 port 443, then TLS handshake
  → HTTP: GET /   ←  200 OK + HTML
  → browser reads the HTML, requests CSS and images the same way
  → browser lays out and paints the page
```

## See it with curl

`curl` sends an HTTP request from the terminal and prints the response. It's installed on macOS and comes with Git Bash on Windows. The `-v` flag (verbose) prints every step. Run this:

```sh
curl -sv https://example.com -o /dev/null
```

`-s` hides the progress bar, and `-o /dev/null` throws the HTML body away so you can read the headers. Each line starts with a marker:

| Marker | Meaning |
| --- | --- |
| `*` | curl telling you what it's doing: DNS, connecting, TLS |
| `>` | a line of the request curl sent |
| `<` | a line of the response the server sent back |
| `{` or `}` | data received or sent that curl doesn't print |

Here is part of the output, trimmed. Find each step from the lesson in it:

```
* Host example.com:443 was resolved.
* IPv4: 172.66.147.243, 104.20.23.154
*   Trying 172.66.147.243:443...
* Connected to example.com (172.66.147.243) port 443
...
* SSL connection using TLSv1.3 / AEAD-CHACHA20-POLY1305-SHA256
* Server certificate:
*  subject: CN=example.com
...
> GET / HTTP/2
> Host: example.com
> User-Agent: curl/8.7.1
> Accept: */*
>
< HTTP/2 200
< date: Wed, 28 Oct 2026 05:47:15 GMT
< content-type: text/html; charset=utf-8
< server: cloudflare
< last-modified: Sat, 24 Oct 2026 20:05:47 GMT
< age: 2547
<
```

`Host ... was resolved` is DNS. `Connected to ... port 443` is TCP. The `SSL connection` and certificate lines are TLS. The `>` lines are the HTTP request, and the `<` lines are the response. You'll see headers you don't recognize. Look any of them up on MDN's [HTTP headers reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers).

To see only the response headers, use `-I`. It sends a `HEAD` request, which asks for the headers without the body:

```sh
curl -I http://github.com
```

You see `HTTP/1.1 301 Moved Permanently` and a `Location: https://github.com/` header. GitHub is telling you to use `https` instead. Add `-L` to make curl follow the redirect:

```sh
curl -sIL http://github.com
```

Now you see two responses: the `301`, then the response from the new location.

## See it in the Network tab

Every browser has the same view built in.

1. Open [developer.mozilla.org](https://developer.mozilla.org) in Chrome, Edge, or Firefox.
2. Open DevTools: F12 on Windows, Cmd+Option+I on macOS.
3. Click the **Network** tab.
4. Reload the page. Every request the page makes appears as a row.

The columns you need first:

| Column | What it shows |
| --- | --- |
| **Name** | The file requested |
| **Status** | The status code |
| **Type** | What kind of file: `document`, `stylesheet`, `script`, `png`, `font` |
| **Size** | Bytes transferred. `(memory cache)` or `(disk cache)` means the browser reused a saved copy |
| **Time** | How long the request took |

The bar at the bottom counts the requests and the total transferred.

Click the first row, the `document`. The **Headers** panel shows the same things `curl -v` showed: the request URL, method, status code, the server's address, then the response headers and the request headers. The **Response** panel shows the HTML the server sent.

Try it. Reload the page again and compare the **Size** column. Many files now come from the cache. Then check **Disable cache** at the top of the panel and reload. Every file is downloaded again.

## HTTP methods

The method in the request line tells the server what you want to do. These five cover almost everything you'll build in this course:

| Method | Asks the server to | Has a body | Changes data on the server |
| --- | --- | --- | --- |
| `GET` | Send a resource | No | No |
| `POST` | Create something, or run an action | Yes | Yes |
| `PUT` | Replace a resource with the one in the body | Yes | Yes |
| `PATCH` | Change part of a resource | Yes | Yes |
| `DELETE` | Delete a resource | Usually no | Yes |

`HEAD` is `GET` without the body, which is what `curl -I` sends. A `GET` must never change anything. Browsers, search engines, and link previews send `GET` requests to any URL they see, and they assume it's safe to repeat.

When you type a URL and press Enter, the browser sends `GET`. When you submit a form that has `method="post"`, it sends `POST` with the form fields in the body. You build that form in lesson 03.

## HTTP status codes

The status code tells the client how the request went. The first digit gives the class:

| Class | Meaning |
| --- | --- |
| `1xx` | Information. You rarely see these |
| `2xx` | Success |
| `3xx` | Go somewhere else |
| `4xx` | The client made a mistake |
| `5xx` | The server failed |

The ones you'll meet every week:

| Code | Name | When you see it |
| --- | --- | --- |
| `200` | OK | The request worked, and the body has the result |
| `201` | Created | A `POST` created something new |
| `204` | No Content | It worked, and there's nothing to send back |
| `301` | Moved Permanently | The resource has a new URL for good. The `Location` header has it |
| `302` | Found | Go to the `Location` URL for now, but keep using this one |
| `304` | Not Modified | Your cached copy is still good. Use it |
| `400` | Bad Request | The request is malformed or missing something |
| `401` | Unauthorized | You're not logged in |
| `403` | Forbidden | You're logged in, but you're not allowed to do this |
| `404` | Not Found | Nothing lives at this URL |
| `405` | Method Not Allowed | This URL exists, but not for this method |
| `429` | Too Many Requests | Slow down |
| `500` | Internal Server Error | The server's code crashed |
| `502` | Bad Gateway | A server in the middle got a bad answer from the server behind it |
| `503` | Service Unavailable | The server is overloaded or down for maintenance |

`401` is badly named. It means "not authenticated", that is, "I don't know who you are." `403` means "I know who you are, and the answer is no."

Try it:

```sh
curl -sI https://example.com/this-page-does-not-exist
```

The first line ends in `404`.

The full list is on MDN's [HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status) page.

## Exercises

Open each file in `exercises/` and fill in every blank. Write in your own words. A short, correct sentence beats a long copied one.

1. `01-curl.md`. Run `curl -v` on three sites, paste the output, and annotate the request and response. Then answer the questions about the Network tab.
2. `02-status-codes.md`. For each scenario, write the status code the server should send and one sentence on why. Then answer the questions about methods.

### Stretch goals

These aren't reviewed for a grade. Mention them in your PR description if you try them.

- Run `curl -sv https://example.com -o /dev/null --http1.1` and compare it with the HTTP/2 output. What changed in the request and response lines?
- Run `nslookup github.com` twice, a minute apart. Do you get the same addresses?
- In the Network tab, right-click the column headers and add the **Protocol** column. Which requests use `h2` or `h3`?

## Submit

Commit your work, push the branch, and open a pull request:

```sh
git add lessons/02-how-the-web-works
git commit -m "Complete lesson 02 exercises"
git push -u origin lesson-02
gh pr create --fill
```

The full steps, including what to do when you get review comments, are in [how to submit your work](../../docs/student-workflow.md).

## Review focus

Your reviewer looks for these things:

- Each `curl` output is pasted in full, and every annotation points at a real line in it
- You can tell the DNS, TCP, TLS, and HTTP parts of the output apart
- Each status code answer names the right code, and the reason shows you know why it isn't a nearby code (`401` versus `403`, `301` versus `302`)
- Every blank is filled in, in your own words
