# AGENTS.md

- Use Python 3.14 for this project.
- Backend architecture: router -> service -> repository -> database.
- Base API URL: /api/v1.
- Do not commit `.env`.
- Do not commit `.venv`.
- Do not commit AI model weights.
- Do not access the database directly from routers.
- Do not call SAM/OpenCV directly from routers.
- SAM is responsible for segmentation.
- OpenCV is responsible for marker detection, perspective correction, and millimeter measurement.
- MVP measures only one foot.
- Use the user-provided `(x, y)` as the SAM positive point prompt.
- Do not modify files outside the requested scope.
