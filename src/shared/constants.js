/**
 * アプリケーション全体で使用する定数
 */

const path = require("path");
const { app } = require("electron");

// アプリケーションデータディレクトリ
const APP_DATA_DIR = app
  ? app.getPath("userData")
  : path.join(process.env.HOME, "Library", "Application Support", "AI Alignment");

// モデル保存ディレクトリ
const MODELS_DIR = path.join(APP_DATA_DIR, "models");

// 設定ファイルパス
const SETTINGS_PATH = path.join(APP_DATA_DIR, "settings.json");

// デフォルトLLM設定
const DEFAULT_LLM_CONFIG = {
  temperature: 0.7,
  maxTokens: 2048,
};

// IPC チャンネル
const IPC_CHANNELS = {
  MODELS_DIR_SELECT: "modelsDir:select",
  MODELS_DIR_GET: "modelsDir:get",
  MODELS_DIR_SET: "modelsDir:set",
};

// デフォルト設定
const DEFAULT_SETTINGS = {
  modelsDirectory: MODELS_DIR,
};

module.exports = {
  APP_DATA_DIR,
  MODELS_DIR,
  SETTINGS_PATH,
  DEFAULT_LLM_CONFIG,
  IPC_CHANNELS,
  DEFAULT_SETTINGS,
};
