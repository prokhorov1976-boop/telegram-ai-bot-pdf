#!/bin/bash

# Список функций для обновления auth_middleware.py
functions=(
  "delete-pdf"
  "get-ai-settings"
  "get-chat-stats"
  "get-documents"
  "get-messenger-settings"
  "get-page-settings"
  "get-quality-gate-stats"
  "get-widget-settings"
  "manage-api-keys"
  "manage-consent-settings"
  "manage-embeddings"
  "messenger-auto-messages"
  "process-pdf"
  "reindex-embeddings"
  "update-ai-settings"
  "update-widget-settings"
  "upload-pdf"
  "setup-cronjob"
  "weekly-analytics"
  "email-templates"
  "db-backup"
)

# Копируем исправленный auth_middleware.py во все функции
for func in "${functions[@]}"; do
  if [ -d "backend/$func" ]; then
    echo "Copying to backend/$func/"
    cp backend/shared/auth_middleware.py "backend/$func/auth_middleware.py"
  else
    echo "WARNING: backend/$func/ not found"
  fi
done

echo "Done! Updated auth_middleware.py in ${#functions[@]} functions"
