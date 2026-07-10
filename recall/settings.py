"""
Django settings for Recall — Phase 1 (no auth, single user)
Replace the DB credentials below with your local Postgres details.
"""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Security ──────────────────────────────────────────────────────────────────
SECRET_KEY = 'replace-me-with-a-real-secret-key-before-deploying'
DEBUG = True
ALLOWED_HOSTS = []


# ── Apps ──────────────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'journal',                    # ← our app
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'recall.urls'


# ── Templates ─────────────────────────────────────────────────────────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        # Django will also look inside each app's templates/ folder automatically.
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'recall.wsgi.application'


# ── Database (PostgreSQL) ──────────────────────────────────────────────────────
# Replace NAME, USER, PASSWORD with your local Postgres credentials.
# PORT defaults to 5432 — change only if yours differs.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'recall_db',      # create this database first: createdb recall_db
        'USER': 'postgres',       # your Postgres user
        'PASSWORD': 'ashwinsh',           # your Postgres password (empty string if none)
        'HOST': 'localhost',
        'PORT': '5432',
    }
}


# ── Auth password validation ───────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ── Internationalisation ───────────────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'          # change to your local tz e.g. 'Europe/London' if you want
                           # created_at dates to reflect local midnight
USE_I18N = True
USE_TZ = True              # all datetimes stored as UTC, converted on display


# ── Static files ──────────────────────────────────────────────────────────────
STATIC_URL = 'static/'


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ── Django REST Framework (Phase 8) ───────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# The Vite dev server (localhost:5173) proxies /api/* to this Django server.
# Its proxy forwards the browser's real Origin header through unchanged, so
# Django's CSRF Origin check needs to trust it explicitly.
CSRF_TRUSTED_ORIGINS = ['http://localhost:5173']