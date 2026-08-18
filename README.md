# Vertara
Transform any video into its vertical story.

## Video import

MP4, WebM, and browser-compatible MOV files open directly. If a browser cannot decode a selected video, Vertara tries a local conversion to H.264/AAC MP4. The picker also accepts common video containers: MOV, MKV, AVI, M4V, MPEG/MPG, MTS/M2TS/TS, WMV, FLV, 3GP, and 3G2.

For the broadest codec support and fastest conversion, run the optional native local helper on the same device. It uses the installed `ffmpeg` binary and can use native hardware encoders when available; the file is sent only to `127.0.0.1`, never to Vertara or another server.

```sh
VERTARA_ALLOWED_ORIGIN=http://localhost:3000 npm run native-helper
```

For a deployed editor, set `VERTARA_ALLOWED_ORIGIN` to that editor's exact origin before starting the helper. The helper needs a full FFmpeg installation on the user’s device. It processes one video at a time, writes temporary files only to the operating system’s temp folder, and removes them when conversion completes or fails.
