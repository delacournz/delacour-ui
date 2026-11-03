---
"@delacour/react-native-ui": patch
---

`Avatar` retries its image when any request field changes, the cache mode included. The retry key is now a JSON array of the URI, bundle, method, sorted headers, body and cache mode, so a header value with `&` or `=` no longer shares a key with a different request.
