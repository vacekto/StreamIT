# StreamIT

Backend for streaming platform to upload, browse and watch saved videos. This is however work in progress and only authentication is implemented at this point. Auth is rolled manually, after signing up, user can sign in either via password or OAuth 2.0 service, after which JWT access and refresh tokens are generated and rotated using Redis instance. Frontend for this is also work in progress, available [here](https://github.com/vacekto/StreamIT-app)
