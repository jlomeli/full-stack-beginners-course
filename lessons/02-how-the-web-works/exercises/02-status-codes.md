# Status code quiz

For each scenario, write the status code the server should send and one sentence on why. Use the tables in the lesson README. When two codes seem close, say why you picked yours.

## Status codes

1. You open a news article and it loads normally.
   - Code:
   - Why:

2. You submit a sign-up form. The server creates your account and sends it back.
   - Code:
   - Why:

3. You delete one of your comments. The server deletes it and has nothing to send back.
   - Code:
   - Why:

4. A blog moved from `oldblog.example` to `blog.example` for good. Browsers and search engines should update their links.
   - Code:
   - Why:

5. You open `/account` while logged out. The server sends you to `/login` for now. After you log in, `/account` works again.
   - Code:
   - Why:

6. Your browser asks for a logo it saved yesterday. The server says your saved copy is still current.
   - Code:
   - Why:

7. A form sends a date as `2026-13-45`, and the server can't make sense of it.
   - Code:
   - Why:

8. You request `/api/orders` without logging in.
   - Code:
   - Why:

9. You're logged in as a student and try to open the instructor's gradebook.
   - Code:
   - Why:

10. You mistype a URL: `/lessons/0022`.
    - Code:
    - Why:

11. You send `DELETE` to `/api/lessons`, which only supports `GET`.
    - Code:
    - Why:

12. Your script sends 500 requests in one second, and the API tells it to slow down.
    - Code:
    - Why:

13. The server's code has a bug and crashes while building the response.
    - Code:
    - Why:

14. The site is down for planned maintenance for the next hour.
    - Code:
    - Why:

15. A server in front of the app forwards your request, but the app behind it sends back garbage.
    - Code:
    - Why:

## Methods

16. Which method does the browser send when you type a URL and press Enter?
    - Answer:

17. A sign-up form creates a new account. Which method should it use, and why not `GET`?
    - Answer:

18. What's the difference between `PUT` and `PATCH`?
    - Answer:

19. Which method does `curl -I` send, and how is it different from `GET`?
    - Answer:

20. Why must a `GET` request never change data on the server?
    - Answer:
