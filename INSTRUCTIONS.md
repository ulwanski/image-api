# NodeJS Recruitment Task

This task will require from you to create a simple REST API for uploading and serving images.

> Read through the task. If you already have sample code that covers the topics of the task that represent your skill level, you can use that instead. Bare in mind, that if we decide it's not sufficient, we can ask you to do the task regardless ;)

## Specification

The API should consist of following endpoints:

- `POST /images`
    - Enpoint must allow to upload an image in commonly used image formats.
    - Endpoint must allow for setting image `title`
    - Image object must be stored in database
    - Image file must be stored in storage (see **Requirements**)
    - Image should be resized according to `width` and `height` parameters provided in request
- `GET /images`
    - Endpoint must return a list of image objects with their respective `id`, `url`, `title`, `width` and `height`
    - Endpoint should allow for filtering based on `title` - "title must contain {text}"
    - Enpoint should include pagination
- `GET /images/:id`
    - Endpoint should return single image object with their respective `id`, `url`, `title`, `width` and `height` based on provided `id`

## Requriements

Preffered options are marked with **bold**.

1. Dev environment - **docker(-compose)**
2. NodeJS - latest LTS
3. Framework - **NestJS**, Express, Hapi
4. Database - any relational (**PostgreSQL**, MySQL, sqlite)
5. Storage - **filesystem** or external storage (**Amazon S3**, Azure Storage, Gogole Storage)
6. Image processing - image should be **scaled** or cropped and optimized to given size
7. Tests
8. API Documentation - OpenAPIv3 (swagger)
9. Dev documentation (readme.md)

## Review

The application's code can be hosted as a public repository, or private repository with READ access to the reviewers - their emails or usernames should be provided in the email you received this task with.

If you have any questions feel free to ask - we are availbile via the same email addresses as reviewers :)

Good luck :)
