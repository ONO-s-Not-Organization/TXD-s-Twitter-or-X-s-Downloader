// ==UserScript==
// @name         Twitter/X Media Downloader
// @name:zh-CN   Twitter/X 媒体下载器
// @description        One-click download of images/videos from Twitter/X, with custom filenames and history.
// @description:zh-CN  一键下载 Twitter/X 图片和视频，支持自定义文件名和下载历史记录。
// @author      ShanksSU
// @namespace    https://github.com/ShanksSU/twitter-media-downloader
// @version     0.5.1
// @match       https://twitter.com/*
// @match       https://x.com/*
// @icon        https://www.google.com/s2/favicons?sz=64&domain=x.com
// @run-at      document-idle
// @connect     pbs.twimg.com
// @connect     video.twimg.com
// @connect     ton.twitter.com
// @connect     *.twimg.com
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_download
// @grant       GM_addStyle
// @grant       GM_xmlhttpRequest
// @grant       GM.setValue
// @grant       GM.getValue
// @grant       GM.download
// @license     MIT
// @downloadURL https://update.greasyfork.org/scripts/571423/TwitterX%20Media%20Downloader.user.js
// @updateURL https://update.greasyfork.org/scripts/571423/TwitterX%20Media%20Downloader.meta.js
// ==/UserScript==

class Config {
    static VERSION = '0.5.1';
    static AUTH_TOKEN = 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
    static defaultFilename = '{user-name}(@{user-id})_{index}';
    static HISTORY_LIMIT = 500;
    static DOWNLOAD_TIMEOUT_MS = 45000;
    static MOBILE_GM_OPTIMISTIC_MS = 300;
    static DEFAULT_QUERY_ID = '2ICDjqPd81tulZcYrtpTuQ';
    static QUERY_ID_STORAGE_KEY = 'tmd_query_id';
    static BEARER_STORAGE_KEY = 'tmd_bearer';

    static language = {
        en: {
            download: 'Download', completed: 'Download Completed', settings: 'Settings', history: 'Download Log',
            empty: 'No history yet.', unknown_date: 'Unknown Date', saved: 'Saved',
            toast_open_url: 'Opened media URL. Use system download or long-press to save.',
            errors: {
                API_ERROR: 'API request failed',
                API_EXPIRED: 'API expired, retrying…',
                MEDIA_NOT_FOUND: 'No media found',
                NO_URL: 'Media URL missing',
                ERROR: 'Download failed',
                DOWNLOAD_UNSUPPORTED: 'Download not supported',
                TIMEOUT: 'Download timed out'
            },
            dialog: {
                title: 'Download Settings', save: 'Save', save_history: 'Remember download history',
                auto_bookmark: 'Auto Bookmark on Download', clear_history: 'Clear All History',
                clear_confirm: 'Clear all download history?', pattern: 'File Name Pattern', preview: 'Preview:',
                empty_pattern: 'Pattern cannot be empty.', reset: '(Reset)', shortcut: 'Keyboard Shortcut:',
                history_limit: 'History limit:', download_timeout: 'Download timeout:',
                history_unlimited: 'Unlimited',
                timeout_30s: '30 sec', timeout_45s: '45 sec', timeout_90s: '90 sec',
                pattern_hint: 'Advanced: {date-time:YYYYMMDD}, {date-time-local:…}, {full-text:50}',
                tags: {
                    '{user-name}': 'User Name', '{user-id}': 'User ID', '{status-id}': 'Tweet ID',
                    '{date-time}': 'Time (UTC)', '{date-time-local}': 'Time (Local)', '{full-text}': 'Full Text',
                    '{fav-count}': 'Likes', '{file-type}': 'Media Type', '{file-name}': 'Original Filename',
                    '{media-count}': 'Media Count', '{index}': 'Index',
                    '{rt-user-name}': 'RT User Name', '{rt-user-id}': 'RT User ID'
                }
            },
            table: {
                thumb: 'Thumb', user: 'User', type: 'Type', postTime: 'Post Time',
                downTime: 'Download Time', action: 'Action', go: 'Go', del: 'Delete'
            }
        },
        zh: {
            download: '下载', completed: '下载完成', settings: '设置', history: '下载记录',
            empty: '暂无记录。', unknown_date: '未知时间', saved: '已保存',
            toast_open_url: '已打开媒体链接，请用系统下载或长按保存。',
            errors: {
                API_ERROR: '接口请求失败',
                API_EXPIRED: '接口已过期，正在重试…',
                MEDIA_NOT_FOUND: '未找到媒体',
                NO_URL: '缺少媒体地址',
                ERROR: '下载失败',
                DOWNLOAD_UNSUPPORTED: '当前环境不支持下载',
                TIMEOUT: '下载超时'
            },
            dialog: {
                title: '下载设置', save: '保存', save_history: '保存下载记录',
                auto_bookmark: '下载时自动加入书签', clear_history: '(清除)',
                clear_confirm: '确认要清除下载记录？', pattern: '文件名格式', preview: '预览:',
                empty_pattern: '文件名格式不能为空。', reset: '(重置)', shortcut: '快捷键设定:',
                history_limit: '历史保留:', download_timeout: '下载超时:',
                history_unlimited: '不限制',
                timeout_30s: '30秒', timeout_45s: '45秒', timeout_90s: '90秒',
                pattern_hint: '高级语法: {date-time:YYYYMMDD}、{date-time-local:…}、{full-text:50}',
                tags: {
                    '{user-name}': '用户名称', '{user-id}': '用户账号', '{status-id}': '推文 ID',
                    '{date-time}': '时间 (UTC)', '{date-time-local}': '时间 (本地)', '{full-text}': '推文内文',
                    '{fav-count}': '点赞数', '{file-type}': '媒体类型', '{file-name}': '原始文件名',
                    '{media-count}': '媒体总数', '{index}': '序号',
                    '{rt-user-name}': '转帖者名称', '{rt-user-id}': '转帖者账号'
                }
            },
            table: {
                thumb: '缩图', user: '用户', type: '类型', postTime: '贴文时间',
                downTime: '下载时间', action: '动作', go: '前往', del: '删除'
            }
        }
    };

    static logIconUri = `data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'%3E%3C/path%3E%3Cpolyline points='14 2 14 8 20 8'%3E%3C/polyline%3E%3Cline x1='16' y1='13' x2='8' y2='13'%3E%3C/line%3E%3Cline x1='16' y1='17' x2='8' y2='17'%3E%3C/line%3E%3Cpolyline points='10 9 9 9 8 9'%3E%3C/polyline%3E%3C/svg%3E`;

    static media_btn_css = `
        .tmd-down {margin-left: 12px; order: 99; position: relative;}
        .tmd-down:hover > div > div > div > div {color: #FFD700;}
        .tmd-down:hover > div > div > div > div > div {background-color: rgba(255, 215, 0, 0.1);}
        .tmd-down:active > div > div > div > div > div {background-color: rgba(255, 215, 0, 0.2);}
        .tmd-down:hover svg {color: #FFD700;}
        .tmd-down:hover div:first-child:not(:last-child) {background-color: rgba(255, 215, 0, 0.1);}
        .tmd-down:active div:first-child:not(:last-child) {background-color: rgba(255, 215, 0, 0.2);}
        .tmd-down.tmd-media {position: absolute; right: 0;}
        .tmd-down.tmd-media > div {display: flex; border-radius: 99px; margin: 2px;}
        .tmd-down.tmd-media > div > div {display: flex; margin: 6px; color: #fff;}
        .tmd-down.tmd-media:hover > div {background-color: rgba(255,255,255, 0.6);}
        .tmd-down.tmd-media:hover > div > div {color: #FFD700;}
        .tmd-down.tmd-media:not(:hover) > div > div {filter: drop-shadow(0 0 1px #000);}
        .tmd-down g {display: none;}
        .tmd-down.download g.download, .tmd-down.completed g.completed, .tmd-down.exist g.completed, .tmd-down.loading g.loading,.tmd-down.failed g.failed {display: unset;}
        .tmd-down.exist svg {color: #FFD700;}
        .tmd-down.loading svg {animation: spin 1s linear infinite; color: #FFD700;}
        @keyframes spin {0% {transform: rotate(0deg);} 100% {transform: rotate(360deg);}}
        @keyframes tmd-pop-anim {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.3); opacity: 1; }
            100% { transform: scale(1); }
        }
        @keyframes tmd-burst-anim {
            0% {
                box-shadow:
                    0 -10px 0 0 #00ba7c, 7px -7px 0 0 #FFD700,
                    10px 0 0 0 #00ba7c,  7px 7px 0 0 #FFD700,
                    0 10px 0 0 #00ba7c,  -7px 7px 0 0 #FFD700,
                    -10px 0 0 0 #00ba7c, -7px -7px 0 0 #FFD700;
                opacity: 1;
                transform: translate(-50%, -50%) scale(0.5);
            }
            100% {
                box-shadow:
                    0 -25px 0 0 #00ba7c, 18px -18px 0 0 #FFD700,
                    25px 0 0 0 #00ba7c,  18px 18px 0 0 #FFD700,
                    0 25px 0 0 #00ba7c,  -18px 18px 0 0 #FFD700,
                    -25px 0 0 0 #00ba7c, -18px -18px 0 0 #FFD700;
                opacity: 0;
                transform: translate(-50%, -50%) scale(1.2);
            }
        }
        .tmd-down.completed svg {
            color: #00ba7c;
            animation: tmd-pop-anim 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .tmd-down.completed:hover div:first-child:not(:last-child) {
            background-color: rgba(0, 186, 124, 0.2);
        }
        .tmd-desktop .tmd-down.completed::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: tmd-burst-anim 0.6s ease-out forwards;
            pointer-events: none;
        }
        .tmd-down.tmd-img {position: absolute; right: 0; bottom: 0; display: none !important; z-index: 5;}
        .tmd-down.tmd-img > div {display: flex; border-radius: 99px; margin: 2px; background-color: rgba(255,255,255, 0.6);}
        .tmd-down.tmd-img > div > div {display: flex; margin: 6px; color: #fff !important;}
        .tmd-down.tmd-img:not(:hover) > div > div {filter: drop-shadow(0 0 1px #000);}
        .tmd-down.tmd-img:hover > div > div {color: #FFD700;}
        .tmd-desktop :hover > .tmd-down.tmd-img,
        .tmd-desktop .tmd-img.loading,
        .tmd-desktop .tmd-img.completed,
        .tmd-desktop .tmd-img.exist,
        .tmd-desktop .tmd-img.failed {display: block !important;}
        .tmd-mobile .tmd-down.tmd-img {display: block !important;}
        .tmd-mobile .tmd-down.tmd-img > div,
        .tmd-mobile .tmd-down.tmd-media > div {min-width: 44px; min-height: 44px; align-items: center; justify-content: center;}
        .tmd-mobile .tmd-down.tmd-img > div > div,
        .tmd-mobile .tmd-down.tmd-media > div > div {margin: 10px;}
        .tweet-detail-action-item {width: 20% !important;}
        .tmd-toast {
            position: fixed; left: 50%; bottom: 80px; transform: translateX(-50%);
            background: rgba(15,20,25,0.92); color: #fff; padding: 10px 16px; border-radius: 8px;
            z-index: 10001; font-size: 13px; max-width: 90vw; text-align: center;
            pointer-events: none; opacity: 0; transition: opacity 0.2s;
        }
        .tmd-toast.show { opacity: 1; }
    `;

    static modal_structure_css = `
        .tmd-modal-wrapper {position: fixed; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 10000; display: flex; justify-content: center; align-items: center;}
        .tmd-modal-dialog {background-color: #fff; border-radius: 10px; width: 850px; max-width: 95vw; display: flex; flex-direction: column; color: #0f1419; font-family: sans-serif; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: background-color 0.2s, color 0.2s;}
        .tmd-mobile .tmd-modal-dialog {width: 100%; max-width: 100vw; max-height: 92vh; border-radius: 12px 12px 0 0; align-self: flex-end;}
        .tmd-modal-header {padding: 15px 20px; border-bottom: 1px solid #eff3f4; display: flex; justify-content: space-between; align-items: center; background: #f7f9f9; transition: background-color 0.2s;}
        .tmd-modal-header-left {display: flex; align-items: center; gap: 10px;}
        .tmd-modal-title {margin: 0; font-size: 18px; font-weight: bold;}
        .tmd-modal-actions {display: flex; align-items: center; gap: 10px;}
        .tmd-icon-btn {cursor: pointer; display: flex; align-items: center; color: #536471; background: none; border: none; padding: 0; transition: color 0.2s; min-width: 32px; min-height: 32px; justify-content: center;}
        .tmd-icon-btn:hover {color: #0f1419;}
        .tmd-icon-btn.danger {color: #f4212e;}
        .tmd-icon-btn.danger:hover {color: #c50f1a;}
        .tmd-modal-content {overflow-y: auto; max-height: 60vh; padding: 0;}
        .tmd-mobile .tmd-modal-content {max-height: 70vh;}
        .tmd-modal-settings {padding: 20px; overflow-y: auto; max-height: 60vh;}
        .tmd-mobile .tmd-modal-settings {max-height: 70vh;}
        .tmd-empty-text {text-align: center; color: #536471; margin: 20px 0; padding: 20px;}
        .tmd-modal-content::-webkit-scrollbar, .tmd-table-wrapper::-webkit-scrollbar {width: 8px; height: 8px;}
        .tmd-modal-content::-webkit-scrollbar-track, .tmd-table-wrapper::-webkit-scrollbar-track {background: #ffffff; border-radius: 4px;}
        .tmd-modal-content::-webkit-scrollbar-thumb, .tmd-table-wrapper::-webkit-scrollbar-thumb {background: #cccccc; border-radius: 4px;}
        .tmd-modal-content::-webkit-scrollbar-thumb:hover, .tmd-table-wrapper::-webkit-scrollbar-thumb:hover {background: #b3b3b3;}
        select.tmd-lang-select { background: #fff; color: #0f1419; border: 1px solid #cfd9de; border-radius: 4px; padding: 4px; font-size: 13px; outline: none; cursor: pointer; font-weight: bold; transition: 0.2s; }
        .tmd-dark-theme { background-color: #15202b; color: #fff; border: 1px solid #38444d; box-shadow: 0 4px 12px rgba(255,255,255,0.05); }
        .tmd-dark-theme .tmd-modal-header { background: #1e2732; border-bottom: 1px solid #38444d; }
        .tmd-dark-theme .tmd-icon-btn { color: #8899a6; }
        .tmd-dark-theme .tmd-icon-btn:hover { color: #fff; }
        .tmd-dark-theme .tmd-empty-text { color: #8899a6; }
        .tmd-dark-theme .tmd-table th { background: #1e2732; color: #8899a6; border-bottom: 1px solid #38444d; box-shadow: 0 1px 0 #38444d; }
        .tmd-dark-theme .tmd-table td, .tmd-dark-theme .tmd-log-item { border-bottom: 1px solid #38444d; }
        .tmd-dark-theme .tmd-table tbody tr:hover { background: #1e2732; }
        .tmd-dark-theme .tmd-action-btn { background: #1e2732; border-color: #38444d; color: #fff; }
        .tmd-dark-theme .tmd-action-btn:hover { background: #2c3640; }
        .tmd-dark-theme .tmd-action-btn.del { background: transparent; border-color: #5c1822; color: #f4212e; }
        .tmd-dark-theme .tmd-action-btn.del:hover { background: #311319; }
        .tmd-dark-theme .tmd-textarea { background: #000; border-color: #38444d; color: #fff; }
        .tmd-dark-theme .tmd-preview-box { background: #1e2732; border-color: #38444d; color: #fff; }
        .tmd-dark-theme select.tmd-lang-select { background: #1e2732; color: #fff; border-color: #38444d; }
        .tmd-dark-theme .tmd-modal-content::-webkit-scrollbar-track, .tmd-dark-theme .tmd-table-wrapper::-webkit-scrollbar-track {background: #15202b;}
        .tmd-dark-theme .tmd-modal-content::-webkit-scrollbar-thumb, .tmd-dark-theme .tmd-table-wrapper::-webkit-scrollbar-thumb {background: #38444d;}
        .tmd-dark-theme .tmd-modal-content::-webkit-scrollbar-thumb:hover, .tmd-dark-theme .tmd-table-wrapper::-webkit-scrollbar-thumb:hover {background: #8899a6;}
        .tmd-dark-theme .tmd-card { border-bottom-color: #38444d; }
        .tmd-dark-theme .tmd-card-meta { color: #8899a6; }
    `;

    static history_log_css = `
        .tmd-history-btn {position: fixed; left: 16px; bottom: 16px; color: #000; background: #fff; border: 1px solid #ccc; border-radius: 8px; padding: 4px; display: flex; align-items: center; cursor: pointer; z-index: 9999; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: 0.2s;}
        .tmd-mobile .tmd-history-btn {left: auto; right: 16px; bottom: 72px; min-width: 44px; min-height: 44px; justify-content: center;}
        .tmd-history-btn:hover {background: #f0f0f0;}
        .tmd-history-btn.tmd-dark-theme {background: #15202b; color: #fff; border-color: #38444d;}
        .tmd-history-btn.tmd-dark-theme:hover {background: #1e2732;}
        .tmd-history-btn label {display: inline-flex; align-items: center; margin: 0 8px; cursor: pointer; font-family: monospace; font-size: 14px;}
        .tmd-history-btn label:before {content: " "; width: 32px; height: 16px; background-position: center; background-repeat: no-repeat; background-image:url("${Config.logIconUri}");}

        .tmd-table-wrapper { width: 100%; overflow-x: auto; }
        .tmd-table { width: max-content; min-width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; font-family: sans-serif; white-space: nowrap; }
        .tmd-table th, .tmd-table td { border-bottom: 1px solid #eff3f4; vertical-align: middle; }

        .tmd-table td {
            padding: 10px 15px;
            max-width: 10px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .tmd-table td:last-child { max-width: none; overflow: visible; }
        .tmd-table th { background: #f7f9f9; color: #536471; position: sticky; top: 0; z-index: 10; font-weight: bold; box-shadow: 0 1px 0 #eff3f4; padding: 0; }
        .tmd-table th:nth-child(1) .tmd-th-inner { width: 65px; }
        .tmd-table th:nth-child(2) .tmd-th-inner { width: 140px; }
        .tmd-table th:nth-child(3) .tmd-th-inner { width: 70px; }
        .tmd-table th:nth-child(4) .tmd-th-inner { width: 130px; }
        .tmd-table th:nth-child(5) .tmd-th-inner { width: 130px; }
        .tmd-table th:nth-child(6) .tmd-th-inner { width: 120px; resize: none; }

        .tmd-th-inner { resize: horizontal; overflow: hidden; padding: 10px 15px; min-width: 40px; display: block; box-sizing: border-box; }
        .tmd-table tbody tr:hover { background: #f7f9f9; }
        .tmd-thumb { width: 44px; height: 44px; object-fit: cover; border-radius: 6px; background: #eee; display: block; }
        .tmd-action-btn { background: #eff3f4; border: 1px solid #cfd9de; padding: 6px 12px; border-radius: 99px; cursor: pointer; color: #0f1419; font-size: 12px; margin-right: 6px; font-weight: bold; transition: 0.2s; }
        .tmd-action-btn:hover { background: #e1e8ed; }
        .tmd-action-btn.del { color: #f4212e; border-color: #fcaeb4; background: #fff; }
        .tmd-action-btn.del:hover { background: #fce8e8; }

        .tmd-card-list { display: flex; flex-direction: column; }
        .tmd-card { display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #eff3f4; align-items: center; }
        .tmd-card-body { flex: 1; min-width: 0; }
        .tmd-card-user { font-weight: bold; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .tmd-card-meta { font-size: 12px; color: #536471; margin-top: 4px; }
        .tmd-card-actions { display: flex; flex-direction: column; gap: 6px; }
        .tmd-card-actions .tmd-action-btn { margin-right: 0; min-height: 36px; }
    `;

    static settings_form_css = `
        .tmd-checkbox-label {display: flex; align-items: center; margin-bottom: 20px; cursor: pointer; font-size: 15px;}
        .tmd-checkbox-label input {margin-right: 10px; cursor: pointer; width: 16px; height: 16px;}
        .tmd-pattern-header {display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;}
        .tmd-mobile .tmd-pattern-header {flex-direction: column; align-items: stretch; gap: 12px;}
        .tmd-pattern-label {font-weight: bold; font-size: 15px;}
        .tmd-btn-reset {cursor: pointer; color: #1d9bf0; font-size: 13px; border: none; background: none; padding: 0;}
        .tmd-btn-reset:hover {text-decoration: underline;}
        .tmd-textarea {width: 100%; height: 80px; box-sizing: border-box; padding: 10px; border: 1px solid #cfd9de; border-radius: 4px; font-family: monospace; resize: vertical; font-size: 14px; color: #fff; background-color: #15202b;}
        .tmd-textarea:focus {outline: none; border-color: #1d9bf0;}
        .tmd-preview-box {margin-top: 10px; padding: 12px; background: #f7f9f9; border: 1px solid #eff3f4; border-radius: 4px; font-family: monospace; font-size: 13px; color: #0f1419; word-break: break-all;}
        .tmd-preview-error {color: #f4212e; font-size: 13px; margin-top: 8px; display: none;}
        .tmd-btn-save {margin-top: 20px; padding: 8px 24px; background: #1d9bf0; color: #fff; border: none; border-radius: 9999px; cursor: pointer; font-weight: bold; font-size: 15px; display: block; margin-left: auto; text-align: center; transition: background 0.2s;}
        .tmd-btn-save:hover:not(:disabled) {background: #1a8cd8;}
        .tmd-btn-save:disabled {background: #8ecdf8; cursor: not-allowed;}
        .tmd-btn-save.saved {background: #00ba7c; cursor: default;}
        .tmd-available-tag { background: #50e3c2; color: #000; padding: 6px 12px; border-radius: 99px; font-size: 13px; font-weight: bold; cursor: pointer; transition: 0.2s; user-select: none; }
        .tmd-available-tag:hover { filter: brightness(0.9); }
        .tmd-tag-container { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .tmd-dark-theme .tmd-available-tag { background: #2c9a82; color: #fff; }
        .tmd-extra-options { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
        .tmd-option-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .tmd-option-row .tmd-pattern-label { margin: 0; }
        .tmd-option-select { background: #fff; color: #0f1419; border: 1px solid #cfd9de; border-radius: 4px; padding: 6px 10px; font-size: 13px; outline: none; cursor: pointer; font-weight: bold; min-width: 120px; }
        .tmd-pattern-hint { margin-top: 8px; font-size: 12px; color: #536471; line-height: 1.4; }
        .tmd-dark-theme .tmd-option-select { background: #1e2732; color: #fff; border-color: #38444d; }
        .tmd-dark-theme .tmd-pattern-hint { color: #8899a6; }
    `;

    static svg = `
        <g class="download">
            <path d="M7 11l5 5 5-5M12 4v12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
        </g>
        <g class="completed">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            <polyline points="8 11 11 14 17 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <g class="loading">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        </g>
        <g class="failed">
            <circle cx="12" cy="12" r="11" fill="#f33" stroke="currentColor" stroke-width="2" opacity="0.8"/>
            <path d="M14.5 7.5l-5 9M9.5 7.5l5 9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        </g>
    `;

    static icon_svg = {
        back: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
        settings: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
        clear: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
        close: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
        sun: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
        moon: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
    };
}

class EnvDetect {
    static detect() {
        const ua = (navigator.userAgent || '').toLowerCase();
        const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
        const isMobile = coarse || /android|iphone|ipad|ipod|mobile|via/.test(ua);
        const hasGMDownload = typeof GM_download === 'function' || (typeof GM !== 'undefined' && typeof GM.download === 'function');
        return { isMobile, hasGMDownload, maxThread: isMobile ? 1 : 2 };
    }
}

class StorageCompat {
    static PREFIX = 'tmd_ls_';

    static async getVal(key, defaultValue) {
        try {
            if (typeof GM !== 'undefined' && typeof GM.getValue === 'function') {
                return await GM.getValue(key, defaultValue);
            }
            if (typeof GM_getValue === 'function') {
                const v = GM_getValue(key, defaultValue);
                return v && typeof v.then === 'function' ? await v : v;
            }
        } catch (e) {
            /* fall through */
        }
        try {
            const raw = localStorage.getItem(StorageCompat.PREFIX + key);
            if (raw == null) return defaultValue;
            return JSON.parse(raw);
        } catch (e) {
            return defaultValue;
        }
    }

    static async setVal(key, value) {
        try {
            if (typeof GM !== 'undefined' && typeof GM.setValue === 'function') {
                await GM.setValue(key, value);
                return;
            }
            if (typeof GM_setValue === 'function') {
                const r = GM_setValue(key, value);
                if (r && typeof r.then === 'function') await r;
                return;
            }
        } catch (e) {
            /* fall through */
        }
        try {
            localStorage.setItem(StorageCompat.PREFIX + key, JSON.stringify(value));
        } catch (e) {
            /* ignore quota */
        }
    }
}

class Utils {
    static getCookie(name) {
        const cookies = {};
        document.cookie.split(';').filter(n => n.includes('=')).forEach(n => {
            n.replace(/^([^=]+)=(.+)$/, (_, key, value) => { cookies[key.trim()] = value.trim(); });
        });
        return name ? cookies[name] : cookies;
    }

    static formatDate(i, o, tz) {
        const d = new Date(i);
        if (tz) d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        const m = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const v = {
            YYYY: d.getUTCFullYear().toString(), YY: d.getUTCFullYear().toString(),
            MM: d.getUTCMonth() + 1, MMM: m[d.getUTCMonth()], DD: d.getUTCDate(),
            hh: d.getUTCHours(), mm: d.getUTCMinutes(), ss: d.getUTCSeconds(),
            h2: d.getUTCHours() % 12, ap: d.getUTCHours() < 12 ? 'AM' : 'PM'
        };
        return o.replace(/(YY(YY)?|MMM?|DD|hh|mm|ss|h2|ap)/g, n => ('0' + v[n]).slice(-n.length));
    }

    static getInvalidChars() {
        return {
            "\n": "　", "\t": "　", "\\": "⧹", "/": "⧸", "|": "｜", ":": "꞉", "*": "＊", "?": "？", '"': '″', "<": "＜", ">": "＞", '\u200b': '', '\u200c': '', '\u200d': '', '\u2060': '', '\ufeff': '', '🔞': ''
        };
    }

    static resolveLangCode(raw) {
        if (!raw) return 'en';
        const lang = String(raw).toLowerCase().replace('_', '-');
        if (lang === 'zh' || lang.startsWith('zh-')) return 'zh';
        if (lang === 'en' || lang.startsWith('en-')) return 'en';
        return 'en';
    }

    static sanitizeFilenamePart(text, invalid) {
        invalid = invalid || Utils.getInvalidChars();
        return String(text || '').replace(/[\n\t\\/|<>*?:"]|[\u200b-\u200d\u2060\ufeff]|🔞/g, v => invalid[v] !== undefined ? invalid[v] : '');
    }

    static extractDateTimeFormat(pattern, invalid) {
        invalid = invalid || Utils.getInvalidChars();
        return pattern.match(/{date-time(-local)?:[^{}]+}/)
            ? pattern.match(/{date-time(?:-local)?:([^{}]+)}/)[1].replace(/[\\/|<>*?:"]/g, v => invalid[v] || '')
            : 'YYYYMMDD-hhmmss';
    }

    static extractFullTextLength(pattern) {
        return pattern.match(/{full-text:(\d+)}/) ? parseInt(pattern.match(/{full-text:(\d+)}/)[1], 10) : 999;
    }

    /**
     * Apply filename pattern. Pass literalExt (e.g. 'jpg') for preview; omit for download (uses .{file-ext} tag).
     * indexSuffix is the exact string to insert before the extension (e.g. '-1' or '-2'), or ''.
     */
    static buildFilename(pattern, info, { indexSuffix = '', literalExt = null } = {}) {
        const extPart = literalExt != null ? ('.' + literalExt) : '.{file-ext}';
        return (pattern.replace(/\.?{file-ext}/, '') + indexSuffix + extPart)
            .replace(/{([^{}:]+)(:[^{}]+)?}/g, (_, name) => info[name] != null ? info[name] : '');
    }

    static $el(parent, tag, className, text, html) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (html != null) el.innerHTML = html;
        else if (text != null) el.textContent = text;
        if (parent) parent.appendChild(el);
        return el;
    }

    static injectStyle(css) {
        if (typeof GM_addStyle === 'function') {
            GM_addStyle(css);
        } else {
            const style = document.createElement('style');
            style.textContent = css;
            document.documentElement.appendChild(style);
        }
    }

    static showToast(msg, ms = 2800) {
        let toast = document.querySelector('.tmd-toast');
        if (!toast) {
            toast = Utils.$el(document.body, 'div', 'tmd-toast');
        }
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._tmdTimer);
        toast._tmdTimer = setTimeout(() => toast.classList.remove('show'), ms);
    }
}

class StorageManager {
    static SETTING_FIELDS = {
        save_history: 'saveHistoryFlag',
        auto_bookmark: 'autoBookmarkFlag',
        filename: 'filenamePattern',
        shortcut_key: 'shortcutKey',
        tmd_theme: 'theme',
        tmd_lang: 'lang',
        history_limit: 'historyLimit',
        download_timeout: 'downloadTimeoutMs'
    };

    static HISTORY_LIMIT_OPTIONS = [100, 500, 1000, 0];
    static TIMEOUT_OPTIONS = [30000, 45000, 90000];

    constructor() {
        this.history = [];
        this.historyIds = new Set();
        this.saveHistoryFlag = true;
        this.autoBookmarkFlag = false;
        this.filenamePattern = Config.defaultFilename;
        this.shortcutKey = 'D';
        this.theme = 'light';
        this.lang = 'auto';
        this.historyLimit = Config.HISTORY_LIMIT;
        this.downloadTimeoutMs = Config.DOWNLOAD_TIMEOUT_MS;
        this.queryId = Config.DEFAULT_QUERY_ID;
        this.bearer = Config.AUTH_TOKEN;
    }

    _syncHistoryIds() {
        this.historyIds = new Set(this.history.map(item => item.id).filter(Boolean));
    }

    static normalizeHistoryLimit(value) {
        const n = Number(value);
        if (StorageManager.HISTORY_LIMIT_OPTIONS.includes(n)) return n;
        return Config.HISTORY_LIMIT;
    }

    static normalizeTimeout(value) {
        const n = Number(value);
        if (StorageManager.TIMEOUT_OPTIONS.includes(n)) return n;
        return Config.DOWNLOAD_TIMEOUT_MS;
    }

    async init() {
        const [
            rawHistory,
            saveHistoryFlag,
            autoBookmarkFlag,
            filenamePattern,
            shortcutKey,
            theme,
            storedLang,
            historyLimit,
            downloadTimeoutMs,
            queryId,
            bearer
        ] = await Promise.all([
            StorageCompat.getVal('download_history', []),
            StorageCompat.getVal('save_history', true),
            StorageCompat.getVal('auto_bookmark', false),
            StorageCompat.getVal('filename', Config.defaultFilename),
            StorageCompat.getVal('shortcut_key', 'D'),
            StorageCompat.getVal('tmd_theme', 'light'),
            StorageCompat.getVal('tmd_lang', 'auto'),
            StorageCompat.getVal('history_limit', Config.HISTORY_LIMIT),
            StorageCompat.getVal('download_timeout', Config.DOWNLOAD_TIMEOUT_MS),
            StorageCompat.getVal(Config.QUERY_ID_STORAGE_KEY, Config.DEFAULT_QUERY_ID),
            StorageCompat.getVal(Config.BEARER_STORAGE_KEY, Config.AUTH_TOKEN)
        ]);

        this.history = (Array.isArray(rawHistory) ? rawHistory : []).map(item => typeof item === 'string' ? { id: item, time: null } : item);
        this._syncHistoryIds();
        this.saveHistoryFlag = saveHistoryFlag;
        this.autoBookmarkFlag = autoBookmarkFlag;
        this.filenamePattern = filenamePattern;
        this.shortcutKey = shortcutKey;
        this.theme = theme;
        this.lang = (storedLang === 'auto' || storedLang === 'en' || storedLang === 'zh') ? storedLang : 'auto';
        this.historyLimit = StorageManager.normalizeHistoryLimit(historyLimit);
        this.downloadTimeoutMs = StorageManager.normalizeTimeout(downloadTimeoutMs);
        this.queryId = queryId;
        this.bearer = bearer;
    }

    async setSetting(key, value) {
        let next = value;
        if (key === 'history_limit') next = StorageManager.normalizeHistoryLimit(value);
        else if (key === 'download_timeout') next = StorageManager.normalizeTimeout(value);
        await StorageCompat.setVal(key, next);
        const field = StorageManager.SETTING_FIELDS[key];
        if (field) this[field] = next;
        else if (key === Config.QUERY_ID_STORAGE_KEY) this.queryId = next;
        else if (key === Config.BEARER_STORAGE_KEY) this.bearer = next;
    }

    async addHistory(infoObj) {
        if (!infoObj.id || this.isDownloaded(infoObj.id)) return;
        this.history.push({ ...infoObj, time: Date.now() });
        this.historyIds.add(infoObj.id);
        const limit = this.historyLimit;
        if (limit > 0 && this.history.length > limit) {
            this.history = this.history.slice(-limit);
            this._syncHistoryIds();
        }
        await StorageCompat.setVal('download_history', this.history);
    }

    isDownloaded(statusId) {
        return this.historyIds.has(statusId);
    }

    async clearHistory() {
        this.history = [];
        this.historyIds = new Set();
        await StorageCompat.setVal('download_history', []);
    }

    async removeHistory(id) {
        this.history = this.history.filter(item => item.id !== id);
        this.historyIds.delete(id);
        await StorageCompat.setVal('download_history', this.history);
    }
}

class QueryIdResolver {
    static interceptedId = null;
    static interceptedBearer = null;
    static hookInstalled = false;

    static installNetworkHook() {
        if (QueryIdResolver.hookInstalled) return;
        QueryIdResolver.hookInstalled = true;

        const capture = (url, headers) => {
            try {
                const u = String(url || '');
                const m = u.match(/\/i\/api\/graphql\/([^/]+)\/TweetResultByRestId/);
                if (m) QueryIdResolver.interceptedId = m[1];
                if (headers) {
                    const auth = headers.get ? headers.get('authorization') : (headers.authorization || headers.Authorization);
                    if (auth && /Bearer\s+/i.test(auth)) QueryIdResolver.interceptedBearer = auth;
                }
            } catch (e) {
                /* ignore */
            }
        };

        try {
            const origFetch = window.fetch;
            if (typeof origFetch === 'function') {
                window.fetch = function (input, init) {
                    const url = typeof input === 'string' ? input : (input && input.url);
                    capture(url, init && init.headers);
                    return origFetch.apply(this, arguments);
                };
            }
        } catch (e) {
            /* ignore */
        }

        try {
            const OrigXHR = window.XMLHttpRequest;
            if (OrigXHR) {
                const open = OrigXHR.prototype.open;
                const setRequestHeader = OrigXHR.prototype.setRequestHeader;
                OrigXHR.prototype.open = function (method, url) {
                    this._tmdUrl = url;
                    return open.apply(this, arguments);
                };
                OrigXHR.prototype.setRequestHeader = function (name, value) {
                    if (String(name).toLowerCase() === 'authorization' && /Bearer\s+/i.test(value)) {
                        QueryIdResolver.interceptedBearer = value;
                    }
                    return setRequestHeader.apply(this, arguments);
                };
                const send = OrigXHR.prototype.send;
                OrigXHR.prototype.send = function () {
                    if (this._tmdUrl) capture(this._tmdUrl, null);
                    return send.apply(this, arguments);
                };
            }
        } catch (e) {
            /* ignore */
        }
    }

    static fromPerformance() {
        try {
            const entries = performance.getEntriesByType('resource') || [];
            for (let i = entries.length - 1; i >= 0; i--) {
                const name = entries[i].name || '';
                const m = name.match(/\/i\/api\/graphql\/([^/]+)\/TweetResultByRestId/);
                if (m) return m[1];
            }
        } catch (e) {
            /* ignore */
        }
        return null;
    }

    static async fromMainBundle() {
        try {
            const scripts = Array.from(document.querySelectorAll('script[src*="responsive-web"]'));
            const candidates = scripts
                .map(s => s.src)
                .filter(src => /main\.[^/]+\.js/.test(src) || /main\.js/.test(src));
            for (const src of candidates.slice(0, 3)) {
                try {
                    const res = await fetch(src);
                    if (!res.ok) continue;
                    const text = await res.text();
                    const re = /queryId:"([A-Za-z0-9_-]+)",operationName:"TweetResultByRestId"|operationName:"TweetResultByRestId"[^}]*queryId:"([A-Za-z0-9_-]+)"/g;
                    let match;
                    while ((match = re.exec(text))) {
                        return match[1] || match[2];
                    }
                    const alt = text.match(/TweetResultByRestId.{0,80}?([A-Za-z0-9_-]{20,22})/);
                    if (alt) return alt[1];
                } catch (e) {
                    /* next */
                }
            }
        } catch (e) {
            /* ignore */
        }
        return null;
    }

    static async resolve(storage, forceRefresh = false) {
        if (!forceRefresh) {
            if (QueryIdResolver.interceptedId) return QueryIdResolver.interceptedId;
            const perf = QueryIdResolver.fromPerformance();
            if (perf) {
                QueryIdResolver.interceptedId = perf;
                if (storage) await storage.setSetting(Config.QUERY_ID_STORAGE_KEY, perf);
                return perf;
            }
            if (storage && storage.queryId) return storage.queryId;
        }

        const fromBundle = await QueryIdResolver.fromMainBundle();
        if (fromBundle) {
            QueryIdResolver.interceptedId = fromBundle;
            if (storage) await storage.setSetting(Config.QUERY_ID_STORAGE_KEY, fromBundle);
            return fromBundle;
        }

        if (QueryIdResolver.interceptedId) return QueryIdResolver.interceptedId;
        return (storage && storage.queryId) || Config.DEFAULT_QUERY_ID;
    }

    static resolveBearer(storage) {
        if (QueryIdResolver.interceptedBearer) return QueryIdResolver.interceptedBearer;
        return (storage && storage.bearer) || Config.AUTH_TOKEN;
    }
}

class TweetUnwrapper {
    static unwrap(result) {
        if (!result) return null;
        let node = result;
        if (node.__typename === 'TweetWithVisibilityResults' && node.tweet) {
            node = node.tweet;
        }
        if (node.tweet) node = node.tweet;

        const rt = node.legacy?.retweeted_status_result?.result
            || node.retweeted_status_result?.result;
        if (rt) {
            const unwrappedRt = TweetUnwrapper.unwrap(rt);
            if (unwrappedRt) return unwrappedRt;
        }

        return node;
    }

    static getFullText(tweet) {
        const note = tweet?.note_tweet?.note_tweet_results?.result?.text
            || tweet?.note_tweet?.note_tweet_results?.result?.richtext?.text;
        if (note) return note;
        return tweet?.legacy?.full_text || tweet?.full_text || '';
    }

    static getMedias(tweet) {
        const legacy = tweet?.legacy || {};
        let medias = legacy.extended_entities?.media || legacy.entities?.media || [];
        if (medias.length) return medias;

        const quoted = tweet?.quoted_status_result?.result;
        if (quoted) {
            const q = TweetUnwrapper.unwrap(quoted);
            const ql = q?.legacy || {};
            return ql.extended_entities?.media || ql.entities?.media || [];
        }
        return [];
    }

    static pickMediaUrl(media) {
        if (!media) return null;
        if (media.type === 'photo') {
            const base = media.media_url_https || media.media_url;
            if (!base) return null;
            return {
                primary: base.includes(':') ? base : (base + ':orig'),
                fallbacks: [
                    base.includes(':') ? base.replace(/:(orig|large|medium|small)$/, ':large') : (base + ':large'),
                    base.replace(/:(orig|large|medium|small)$/, '')
                ].filter((u, i, arr) => u && arr.indexOf(u) === i && u !== (base.includes(':') ? base : (base + ':orig')))
            };
        }

        const variants = media.video_info?.variants || [];
        const mp4 = variants.filter(n => n.content_type === 'video/mp4');
        if (mp4.length) {
            const best = mp4.reduce((a, b) => (a.bitrate || 0) >= (b.bitrate || 0) ? a : b);
            return { primary: best.url, fallbacks: [], isVideo: true };
        }
        const any = variants.find(n => n.url);
        if (any) return { primary: any.url, fallbacks: [], isVideo: true, maybeHls: /m3u8/i.test(any.url) };
        return null;
    }
}

class TwitterAPI {
    static FEATURES = {
        "articles_preview_enabled": true,
        "c9s_tweet_anatomy_moderator_badge_enabled": true,
        "communities_web_enable_tweet_community_results_fetch": false,
        "creator_subscriptions_quote_tweet_preview_enabled": false,
        "creator_subscriptions_tweet_preview_api_enabled": false,
        "freedom_of_speech_not_reach_fetch_enabled": true,
        "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
        "longform_notetweets_consumption_enabled": true,
        "longform_notetweets_inline_media_enabled": true,
        "longform_notetweets_rich_text_read_enabled": true,
        "premium_content_api_read_enabled": false,
        "profile_label_improvements_pcf_label_in_post_enabled": true,
        "responsive_web_edit_tweet_api_enabled": false,
        "responsive_web_enhance_cards_enabled": false,
        "responsive_web_graphql_exclude_directive_enabled": false,
        "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
        "responsive_web_graphql_timeline_navigation_enabled": false,
        "responsive_web_grok_analysis_button_from_backend": false,
        "responsive_web_grok_analyze_button_fetch_trends_enabled": false,
        "responsive_web_grok_analyze_post_followups_enabled": false,
        "responsive_web_grok_image_annotation_enabled": false,
        "responsive_web_grok_share_attachment_enabled": false,
        "responsive_web_grok_show_grok_translated_post": false,
        "responsive_web_jetfuel_frame": false,
        "responsive_web_media_download_video_enabled": false,
        "responsive_web_twitter_article_tweet_consumption_enabled": true,
        "rweb_tipjar_consumption_enabled": true,
        "rweb_video_screen_enabled": false,
        "standardized_nudges_misinfo": true,
        "tweet_awards_web_tipping_enabled": false,
        "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
        "tweetypie_unmention_optimization_enabled": false,
        "verified_phone_label_enabled": false,
        "view_counts_everywhere_api_enabled": true
    };

    static async fetchTweetJson(status_id, storage, forceRefresh = false) {
        const cookies = Utils.getCookie();
        const queryId = await QueryIdResolver.resolve(storage, forceRefresh);
        const bearer = QueryIdResolver.resolveBearer(storage);

        if (storage && bearer && bearer !== storage.bearer) {
            await storage.setSetting(Config.BEARER_STORAGE_KEY, bearer);
        }

        const url = encodeURI(`https://${location.hostname}/i/api/graphql/${queryId}/TweetResultByRestId?variables=${JSON.stringify({
            tweetId: status_id,
            with_rux_injections: false,
            includePromotedContent: true,
            withCommunity: true,
            withQuickPromoteEligibilityTweetFields: true,
            withBirdwatchNotes: true,
            withVoice: true,
            withV2Timeline: true
        })}&features=${JSON.stringify(TwitterAPI.FEATURES)}`);

        const headers = {
            'authorization': bearer,
            'x-twitter-active-user': 'yes',
            'x-twitter-client-language': cookies.lang || 'en'
        };
        if (cookies.ct0) headers['x-csrf-token'] = cookies.ct0;
        if (cookies.gt) headers['x-guest-token'] = cookies.gt;

        const res = await fetch(url, { headers, credentials: 'include' });
        if (!res.ok) {
            if (!forceRefresh && (res.status === 400 || res.status === 404)) {
                const refreshed = await QueryIdResolver.resolve(storage, true);
                if (refreshed && refreshed !== queryId) {
                    return TwitterAPI.fetchTweetJson(status_id, storage, true);
                }
            }
            const err = new Error('API_ERROR');
            err.code = 'API_ERROR';
            err.status = res.status;
            throw err;
        }

        const tweet_detail = await res.json();
        const raw = tweet_detail.data?.tweetResult?.result;
        const tweet = TweetUnwrapper.unwrap(raw);
        if (!tweet || !tweet.legacy) {
            if (!forceRefresh) {
                const refreshed = await QueryIdResolver.resolve(storage, true);
                if (refreshed && refreshed !== queryId) {
                    return TwitterAPI.fetchTweetJson(status_id, storage, true);
                }
            }
            const err = new Error('API_EXPIRED');
            err.code = 'API_EXPIRED';
            throw err;
        }

        if (storage && queryId) {
            await storage.setSetting(Config.QUERY_ID_STORAGE_KEY, queryId);
        }

        return tweet;
    }
}

class Downloader {
    constructor(env, storage) {
        this.env = env;
        this.storage = storage || null;
        this.timeout_ms = (storage && storage.downloadTimeoutMs) || Config.DOWNLOAD_TIMEOUT_MS;
    }

    syncTimeoutFromStorage() {
        if (this.storage) this.timeout_ms = this.storage.downloadTimeoutMs || Config.DOWNLOAD_TIMEOUT_MS;
    }

    async download(task) {
        this.syncTimeoutFromStorage();
        const isVideo = !!task.isVideo || /\.(mp4|m3u8)(\?|$)/i.test(task.url || '');
        if (this.env.hasGMDownload) {
            const gmResult = await this.viaGM(task);
            if (gmResult.ok) return gmResult;
            // Mobile: GM already handed off (or failed to start) — never fall back
            // to viaBlob/openUrl or Via will fire a second download request.
            if (this.env.isMobile) return gmResult;
        }
        if (this.env.isMobile && isVideo) {
            return this.openUrl(task);
        }
        try {
            return await this.viaBlob(task);
        } catch (err) {
            return this.openUrl(task);
        }
    }

    viaGM(task) {
        return new Promise(resolve => {
            const isMobile = this.env.isMobile;
            let settled = false;
            let abortFn = null;
            const finish = (ok, err) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(ok ? { ok: true } : { ok: false, error: err });
            };

            // Desktop waits for real completion; mobile treats "initiated" as success
            // because Via/WebView often never fires onload after system DownloadManager takes over.
            const timer = setTimeout(() => {
                if (isMobile) {
                    finish(true);
                    return;
                }
                try {
                    abortFn && abortFn();
                } catch (e) {
                    /* ignore */
                }
                finish(false, { error: 'timeout', code: 'TIMEOUT' });
            }, isMobile ? Config.MOBILE_GM_OPTIMISTIC_MS : this.timeout_ms);

            try {
                const gmDl = typeof GM_download === 'function' ? GM_download : (GM && GM.download);
                const handle = gmDl({
                    url: task.url,
                    name: task.name,
                    onload: () => finish(true),
                    onerror: r => finish(false, r || { error: 'ERROR' }),
                    ontimeout: r => {
                        if (isMobile) finish(true);
                        else finish(false, r || { error: 'timeout', code: 'TIMEOUT' });
                    }
                });
                if (handle && typeof handle.abort === 'function') abortFn = () => handle.abort();
                if (handle && typeof handle.then === 'function') {
                    handle.then(() => finish(true)).catch(e => {
                        if (isMobile) finish(true);
                        else finish(false, e);
                    });
                }
            } catch (e) {
                finish(false, e);
            }
        });
    }

    async viaBlob(task) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout_ms);
        try {
            let blob;
            if (typeof GM_xmlhttpRequest === 'function') {
                blob = await new Promise((resolve, reject) => {
                    const req = GM_xmlhttpRequest({
                        method: 'GET',
                        url: task.url,
                        responseType: 'blob',
                        onload: r => {
                            if (r.status >= 200 && r.status < 300) resolve(r.response);
                            else reject(new Error('HTTP_' + r.status));
                        },
                        onerror: () => reject(new Error('XHR_ERROR')),
                        ontimeout: () => reject(new Error('TIMEOUT'))
                    });
                    controller.signal.addEventListener('abort', () => {
                        try {
                            req && req.abort && req.abort();
                        } catch (e) {
                            /* ignore */
                        }
                        reject(new Error('TIMEOUT'));
                    });
                });
            } else {
                const res = await fetch(task.url, { signal: controller.signal, credentials: 'omit' });
                if (!res.ok) throw new Error('HTTP_' + res.status);
                blob = await res.blob();
            }
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = task.name || 'download';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                a.remove();
                URL.revokeObjectURL(objectUrl);
            }, 1500);
            return { ok: true };
        } finally {
            clearTimeout(timer);
        }
    }

    openUrl(task) {
        try {
            window.open(task.url, '_blank');
            Utils.showToast((task.toastMsg) || 'Opened media URL');
            return { ok: true, opened: true };
        } catch (err) {
            return { ok: false, error: err };
        }
    }
}

class DownloadQueue {
    constructor(env, downloader) {
        this.tasks = [];
        this.active = 0;
        this.max_thread = env.maxThread;
        this.isMobile = !!env.isMobile;
        this.downloader = downloader;
    }

    add(task) {
        this.tasks.push(task);
        this.pump();
    }

    pump() {
        while (this.active < this.max_thread && this.tasks.length > 0) {
            const task = this.tasks.shift();
            this.active++;
            this.run(task).finally(() => {
                this.active--;
                this.pump();
            });
        }
    }

    async run(task) {
        let lastError = null;
        const maxAttempt = this.isMobile ? 0 : 2;
        for (let attempt = 0; attempt <= maxAttempt; attempt++) {
            task.retry = attempt;
            try {
                const result = await this.downloader.download(task);
                if (result && result.ok) {
                    try {
                        task.onload && task.onload();
                    } catch (e) {
                        /* ignore */
                    }
                    return;
                }
                lastError = result && result.error;
            } catch (e) {
                lastError = e;
            }
        }
        try {
            task.onerror && task.onerror(lastError);
        } catch (e) {
            /* ignore */
        }
    }
}

class UIManager {
    constructor(app) {
        this.app = app;
        this.lang = this.getLang();
        this.historyBtn = null;
        this.processedArticles = new WeakSet();
        this.processedListItems = new WeakSet();
    }

    injectCSS() {
        const modeClass = this.app.env.isMobile ? 'tmd-mobile' : 'tmd-desktop';
        document.documentElement.classList.add(modeClass);
        Utils.injectStyle(Config.media_btn_css + Config.modal_structure_css + Config.history_log_css + Config.settings_form_css);
    }

    setButtonStatus(btn, css, title) {
        if (css) {
            btn.classList.remove('download', 'completed', 'exist', 'loading', 'failed');
            btn.classList.add(css);
        }
        if (title) btn.title = title;
    }

    errorText(code) {
        const map = this.lang.errors || {};
        return map[code] || code || (map.ERROR || 'ERROR');
    }

    getLang() {
        const pref = this.app.storage.lang;
        if (pref !== 'auto' && Config.language[pref]) return Config.language[pref];
        const code = Utils.resolveLangCode(document.documentElement.lang);
        return Config.language[code] || Config.language.en;
    }

    tryClickBookmark(article) {
        if (!this.app.storage.autoBookmarkFlag || !article) return;
        const bookmarkBtn = article.querySelector('button[data-testid="bookmark"]');
        if (bookmarkBtn) bookmarkBtn.click();
    }

    createMediaDownloadBtn(extraClass, statusCss, title) {
        const btn_down = document.createElement('div');
        btn_down.innerHTML = `<div><div><svg viewBox="0 0 24 24" style="width: 18px; height: 18px;">${Config.svg}</svg></div></div>`;
        btn_down.classList.add('tmd-down', extraClass);
        this.setButtonStatus(btn_down, statusCss, title);
        return btn_down;
    }

    bindHistoryItemActions(goBtn, delBtn, item, updateView) {
        goBtn.onclick = () => window.open(`https://x.com/i/status/${item.id}`, '_blank');
        delBtn.onclick = async () => {
            await this.app.storage.removeHistory(item.id);
            this.updateHistoryCount();
            updateView();
        };
    }

    renderHistoryUI() {
        this.historyBtn = document.createElement('div');
        this.historyBtn.title = this.lang.history;
        this.historyBtn.classList.add('tmd-history-btn');
        if (this.app.storage.theme === 'dark') this.historyBtn.classList.add('tmd-dark-theme');

        const label = document.createElement('label');
        label.textContent = String(this.app.storage.history.length);
        this.historyBtn.appendChild(label);
        this.historyBtn.onclick = () => this.showModal();

        if (this.app.env.isMobile) {
            document.body.appendChild(this.historyBtn);
            return;
        }

        const mountToHeader = () => {
            const header = document.querySelector('header[role="banner"]');
            if (header) {
                header.style.position = 'relative';
                header.appendChild(this.historyBtn);
                return true;
            }
            return false;
        };

        if (!mountToHeader()) {
            document.body.appendChild(this.historyBtn);
            const observer = new MutationObserver(() => {
                if (this.historyBtn.parentElement === document.body && mountToHeader()) {
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    updateHistoryCount() {
        if (this.historyBtn) {
            const label = this.historyBtn.querySelector('label');
            if (label) label.textContent = String(this.app.storage.history.length);
        }
    }

    formatDt(ts) {
        if (!ts) return this.lang.unknown_date || 'Unknown Date';
        const d = new Date(ts);
        const pad = n => n.toString().padStart(2, '0');
        return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    showModal(startView = 'history') {
        this.lang = this.getLang();
        let currentView = startView;
        const dialogLang = this.lang.dialog || {};

        const shell = this.createModalShell(dialogLang, () => currentView);
        const { wrapper, titleEl, backBtn, settingsBtn, clearBtn, historyContainer, settingsContainer } = shell;

        this.bindFilenamePatternUI(settingsContainer, dialogLang, wrapper);

        const updateView = () => {
            if (currentView === 'history') {
                this.renderHistoryView(historyContainer, titleEl, backBtn, settingsBtn, clearBtn, settingsContainer, updateView);
            } else {
                titleEl.textContent = dialogLang.title || 'Settings';
                backBtn.style.display = 'flex';
                settingsBtn.style.display = 'none';
                clearBtn.style.display = 'none';
                historyContainer.style.display = 'none';
                settingsContainer.style.display = 'block';
            }
        };

        clearBtn.onclick = async () => {
            if (confirm(dialogLang.clear_confirm || 'Clear all?')) {
                await this.app.storage.clearHistory();
                this.updateHistoryCount();
                updateView();
            }
        };

        settingsBtn.onclick = () => { currentView = 'settings'; updateView(); };
        backBtn.onclick = () => { currentView = 'history'; updateView(); };
        updateView();
    }

    createModalShell(dialogLang, getView) {
        const wrapper = Utils.$el(document.body, 'div', 'tmd-modal-wrapper');
        wrapper.onclick = (e) => { if (e.target === wrapper) wrapper.remove(); };

        const dialog = Utils.$el(wrapper, 'div', 'tmd-modal-dialog');
        if (this.app.storage.theme === 'dark') dialog.classList.add('tmd-dark-theme');

        const header = Utils.$el(dialog, 'div', 'tmd-modal-header');
        const headerLeft = Utils.$el(header, 'div', 'tmd-modal-header-left');
        const backBtn = Utils.$el(headerLeft, 'button', 'tmd-icon-btn', null, Config.icon_svg.back);
        const titleEl = Utils.$el(headerLeft, 'h3', 'tmd-modal-title', '');
        const headerActions = Utils.$el(header, 'div', 'tmd-modal-actions');

        const langSelect = Utils.$el(headerActions, 'select', 'tmd-lang-select');
        [
            { val: 'auto', txt: 'Auto' },
            { val: 'en', txt: 'English' },
            { val: 'zh', txt: '简体中文' }
        ].forEach(l => {
            const opt = Utils.$el(langSelect, 'option', '', l.txt);
            opt.value = l.val;
            if (this.app.storage.lang === l.val) opt.selected = true;
        });

        langSelect.onchange = async () => {
            await this.app.storage.setSetting('tmd_lang', langSelect.value);
            wrapper.remove();
            this.showModal(getView());
        };

        const themeBtn = Utils.$el(headerActions, 'button', 'tmd-icon-btn', null,
            this.app.storage.theme === 'dark' ? Config.icon_svg.sun : Config.icon_svg.moon);
        themeBtn.title = 'Toggle Theme';
        themeBtn.onclick = async () => {
            const newTheme = this.app.storage.theme === 'dark' ? 'light' : 'dark';
            await this.app.storage.setSetting('tmd_theme', newTheme);
            themeBtn.innerHTML = newTheme === 'dark' ? Config.icon_svg.sun : Config.icon_svg.moon;
            dialog.classList.toggle('tmd-dark-theme', newTheme === 'dark');
            if (this.historyBtn) this.historyBtn.classList.toggle('tmd-dark-theme', newTheme === 'dark');
        };

        const settingsBtn = Utils.$el(headerActions, 'button', 'tmd-icon-btn', null, Config.icon_svg.settings);
        settingsBtn.title = this.lang.settings || 'Settings';

        const clearBtn = Utils.$el(headerActions, 'button', 'tmd-icon-btn danger', null, Config.icon_svg.clear);
        clearBtn.title = dialogLang.clear_history || 'Clear History';

        const closeBtn = Utils.$el(headerActions, 'button', 'tmd-icon-btn', null, Config.icon_svg.close);
        closeBtn.onclick = () => wrapper.remove();

        const historyContainer = Utils.$el(dialog, 'div', 'tmd-modal-content');
        const settingsContainer = Utils.$el(dialog, 'div', 'tmd-modal-settings');

        return {
            wrapper, titleEl, backBtn, settingsBtn, clearBtn,
            historyContainer, settingsContainer
        };
    }

    renderHistoryView(historyContainer, titleEl, backBtn, settingsBtn, clearBtn, settingsContainer, updateView) {
        const histLen = this.app.storage.history.length;
        titleEl.textContent = `${this.lang.history || 'History'} (${histLen})`;
        backBtn.style.display = 'none';
        settingsBtn.style.display = 'flex';
        clearBtn.style.display = 'flex';
        historyContainer.style.display = 'block';
        settingsContainer.style.display = 'none';
        historyContainer.textContent = '';

        if (histLen === 0) {
            Utils.$el(historyContainer, 'p', 'tmd-empty-text', this.lang.empty || 'Empty');
            return;
        }

        if (this.app.env.isMobile) {
            this.renderHistoryCards(historyContainer, updateView);
        } else {
            this.renderHistoryTable(historyContainer, updateView);
        }
    }

    renderHistoryCards(historyContainer, updateView) {
        const tableLang = this.lang.table || {};
        const list = Utils.$el(historyContainer, 'div', 'tmd-card-list');
        [...this.app.storage.history].reverse().forEach(item => {
            const card = Utils.$el(list, 'div', 'tmd-card');
            if (item.thumb) {
                const img = Utils.$el(card, 'img', 'tmd-thumb');
                img.src = item.thumb;
            }
            const body = Utils.$el(card, 'div', 'tmd-card-body');
            Utils.$el(body, 'div', 'tmd-card-user', item.user || '-');
            Utils.$el(body, 'div', 'tmd-card-meta', `${item.type || '-'} · ${this.formatDt(item.time)}`);

            const actions = Utils.$el(card, 'div', 'tmd-card-actions');
            const goBtn = Utils.$el(actions, 'button', 'tmd-action-btn', tableLang.go || 'Go');
            const delBtn = Utils.$el(actions, 'button', 'tmd-action-btn del', tableLang.del || 'Delete');
            this.bindHistoryItemActions(goBtn, delBtn, item, updateView);
        });
    }

    renderHistoryTable(historyContainer, updateView) {
        const tableLang = this.lang.table || {};
        const tableWrap = Utils.$el(historyContainer, 'div', 'tmd-table-wrapper');
        const table = Utils.$el(tableWrap, 'table', 'tmd-table');
        const thead = Utils.$el(table, 'thead');
        const trHead = Utils.$el(thead, 'tr');
        ['thumb', 'user', 'type', 'postTime', 'downTime', 'action'].forEach(k => {
            const th = Utils.$el(trHead, 'th');
            Utils.$el(th, 'div', 'tmd-th-inner', tableLang[k] || k);
        });

        const tbody = Utils.$el(table, 'tbody');
        [...this.app.storage.history].reverse().forEach(item => {
            const tr = Utils.$el(tbody, 'tr');
            const tdThumb = Utils.$el(tr, 'td');
            if (item.thumb) {
                const img = Utils.$el(tdThumb, 'img', 'tmd-thumb');
                img.src = item.thumb;
            } else {
                tdThumb.textContent = '-';
            }

            Utils.$el(tr, 'td', '', item.user || '-');
            Utils.$el(tr, 'td', '', item.type || '-');
            Utils.$el(tr, 'td', '', this.formatDt(item.postTime));
            Utils.$el(tr, 'td', '', this.formatDt(item.time));

            const tdAction = Utils.$el(tr, 'td');
            const goBtn = Utils.$el(tdAction, 'button', 'tmd-action-btn', tableLang.go || 'Go');
            const delBtn = Utils.$el(tdAction, 'button', 'tmd-action-btn del', tableLang.del || 'Delete');
            this.bindHistoryItemActions(goBtn, delBtn, item, updateView);
        });
    }

    bindFilenamePatternUI(settingsContainer, dialogLang, wrapper) {
        settingsContainer.textContent = '';

        const top_settings_row = Utils.$el(settingsContainer, 'div', 'tmd-pattern-header');
        top_settings_row.style.alignItems = 'center';

        const left_checkbox_group = Utils.$el(top_settings_row, 'div');
        left_checkbox_group.style.display = 'flex';
        left_checkbox_group.style.flexDirection = 'column';
        left_checkbox_group.style.gap = '10px';

        const save_history_label = Utils.$el(left_checkbox_group, 'label', 'tmd-checkbox-label');
        save_history_label.style.marginBottom = '0';
        const save_history_input = Utils.$el(save_history_label, 'input');
        save_history_input.type = 'checkbox';
        save_history_input.checked = this.app.storage.saveHistoryFlag;
        Utils.$el(save_history_label, 'span', '', dialogLang.save_history || 'Remember download history');

        const auto_bookmark_label = Utils.$el(left_checkbox_group, 'label', 'tmd-checkbox-label');
        auto_bookmark_label.style.marginBottom = '0';
        const auto_bookmark_input = Utils.$el(auto_bookmark_label, 'input');
        auto_bookmark_input.type = 'checkbox';
        auto_bookmark_input.checked = this.app.storage.autoBookmarkFlag;
        Utils.$el(auto_bookmark_label, 'span', '', dialogLang.auto_bookmark || 'Auto Bookmark');

        let shortcut_input = null;
        if (!this.app.env.isMobile) {
            const shortcut_label = Utils.$el(top_settings_row, 'div', 'tmd-pattern-label');
            shortcut_label.style.marginBottom = '0';
            shortcut_label.textContent = dialogLang.shortcut || 'Shortcut:';
            shortcut_input = Utils.$el(shortcut_label, 'input', 'tmd-textarea');
            shortcut_input.style.cssText = 'width: 50px; height: 32px; padding: 4px; text-align: center; margin-left: 10px; font-weight: bold; text-transform: uppercase; display: inline-block;';
            shortcut_input.maxLength = 1;
            shortcut_input.value = this.app.storage.shortcutKey || 'D';
            shortcut_input.oninput = () => { shortcut_input.value = shortcut_input.value.toUpperCase(); };
        }

        const extra_options = Utils.$el(settingsContainer, 'div', 'tmd-extra-options');

        const history_row = Utils.$el(extra_options, 'div', 'tmd-option-row');
        Utils.$el(history_row, 'label', 'tmd-pattern-label', dialogLang.history_limit || 'History limit:');
        const history_limit_select = Utils.$el(history_row, 'select', 'tmd-option-select');
        [
            { val: 100, txt: '100' },
            { val: 500, txt: '500' },
            { val: 1000, txt: '1000' },
            { val: 0, txt: dialogLang.history_unlimited || 'Unlimited' }
        ].forEach(opt => {
            const el = Utils.$el(history_limit_select, 'option', '', opt.txt);
            el.value = String(opt.val);
            if (this.app.storage.historyLimit === opt.val) el.selected = true;
        });

        const timeout_row = Utils.$el(extra_options, 'div', 'tmd-option-row');
        Utils.$el(timeout_row, 'label', 'tmd-pattern-label', dialogLang.download_timeout || 'Download timeout:');
        const timeout_select = Utils.$el(timeout_row, 'select', 'tmd-option-select');
        [
            { val: 30000, txt: dialogLang.timeout_30s || '30 sec' },
            { val: 45000, txt: dialogLang.timeout_45s || '45 sec' },
            { val: 90000, txt: dialogLang.timeout_90s || '90 sec' }
        ].forEach(opt => {
            const el = Utils.$el(timeout_select, 'option', '', opt.txt);
            el.value = String(opt.val);
            if (this.app.storage.downloadTimeoutMs === opt.val) el.selected = true;
        });

        const pattern_header = Utils.$el(settingsContainer, 'div', 'tmd-pattern-header');
        pattern_header.style.marginTop = '20px';
        Utils.$el(pattern_header, 'label', 'tmd-pattern-label', dialogLang.pattern || 'File Pattern');
        const resetBtn = Utils.$el(pattern_header, 'button', 'tmd-btn-reset', dialogLang.reset || '(Reset)');

        const pattern_input = Utils.$el(settingsContainer, 'textarea', 'tmd-textarea');
        const tag_container = Utils.$el(settingsContainer, 'div', 'tmd-tag-container');

        const tagsDict = dialogLang.tags || {};
        const validTagsKeys = Object.keys(tagsDict);

        validTagsKeys.forEach(tagText => {
            const tagBtn = Utils.$el(tag_container, 'div', 'tmd-available-tag', tagsDict[tagText]);
            tagBtn.onclick = () => {
                const start = pattern_input.selectionStart || 0;
                const end = pattern_input.selectionEnd || 0;
                const val = pattern_input.value || '';
                pattern_input.value = val.substring(0, start) + tagText + val.substring(end);
                pattern_input.selectionStart = pattern_input.selectionEnd = start + tagText.length;
                pattern_input.focus();
                updatePreview();
            };
        });

        Utils.$el(settingsContainer, 'div', 'tmd-pattern-hint', dialogLang.pattern_hint || 'Advanced: {date-time:YYYYMMDD}, {date-time-local:…}, {full-text:50}');

        const preview_title = Utils.$el(settingsContainer, 'div', 'tmd-pattern-label', dialogLang.preview || 'Preview:');
        preview_title.style.marginTop = '15px';
        const preview_box = Utils.$el(settingsContainer, 'div', 'tmd-preview-box');
        const preview_error = Utils.$el(settingsContainer, 'div', 'tmd-preview-error', dialogLang.empty_pattern || 'Empty');
        const saveSettingsBtn = Utils.$el(settingsContainer, 'button', 'tmd-btn-save', dialogLang.save || 'Save');

        const updatePreview = () => {
            const val = pattern_input.value.trim();
            if (!val) {
                preview_error.style.display = 'block';
                preview_box.style.display = 'none';
                saveSettingsBtn.disabled = true;
                return;
            }
            preview_error.style.display = 'none';
            preview_box.style.display = 'block';
            saveSettingsBtn.disabled = false;

            const mockInfo = {
                'status-id': '20231011', 'user-name': 'Jingliu', 'user-id': 'Jingliu_love',
                'rt-user-name': 'Zpang', 'rt-user-id': 'chirong726',
                'fav-count': '999', 'file-type': 'photo', 'file-name': 'original_pic',
                'media-count': '2', 'index': '1'
            };

            const out = val.split('\n').join('');
            const invalid = Utils.getInvalidChars();
            const datetime = Utils.extractDateTimeFormat(out, invalid);

            mockInfo['date-time'] = Utils.formatDate(Date.now(), datetime);
            mockInfo['date-time-local'] = Utils.formatDate(Date.now(), datetime, true);

            const textLength = Utils.extractFullTextLength(out);
            mockInfo['full-text'] = 'This is a sample tweet text preview.'.substring(0, textLength);

            const indexSuffix = (!out.includes('{index}') && !out.includes('{file-name}')) ? '-1' : '';
            preview_box.textContent = Utils.buildFilename(out, mockInfo, { indexSuffix, literalExt: 'jpg' });
        };

        resetBtn.onclick = () => {
            pattern_input.value = Config.defaultFilename;
            updatePreview();
        };

        pattern_input.addEventListener('input', updatePreview);
        pattern_input.value = this.app.storage.filenamePattern || Config.defaultFilename;
        updatePreview();

        saveSettingsBtn.onclick = async () => {
            await this.app.storage.setSetting('save_history', save_history_input.checked);
            await this.app.storage.setSetting('auto_bookmark', auto_bookmark_input.checked);
            await this.app.storage.setSetting('filename', pattern_input.value);
            await this.app.storage.setSetting('history_limit', Number(history_limit_select.value));
            await this.app.storage.setSetting('download_timeout', Number(timeout_select.value));
            if (shortcut_input) {
                await this.app.storage.setSetting('shortcut_key', shortcut_input.value);
            }
            this.app.downloader.syncTimeoutFromStorage();
            saveSettingsBtn.textContent = this.lang.saved || 'Saved';
            saveSettingsBtn.classList.add('saved');
            saveSettingsBtn.disabled = true;
            setTimeout(() => wrapper.remove(), 200);
        };
    }

    extractStatusId(href) {
        if (!href) return null;
        const part = href.split('/status/')[1];
        if (!part) return null;
        return part.split(/[\/\?#]/)[0] || null;
    }

    addButtonsToArticle(article) {
        if (!article || this.processedArticles.has(article)) return;
        this.processedArticles.add(article);

        let retweeter_name = '';
        let retweeter_id = '';

        const statusLink = article.querySelector('a[href*="/status/"]');
        const status_id = statusLink ? this.extractStatusId(statusLink.href) : null;

        const media = article.querySelector(['a[href*="/photo/1"]', 'div[role="progressbar"]', 'button[data-testid="playButton"]', 'a[href="/settings/content_you_see"]', 'div.media-image-container', 'div.media-preview-container', 'div[aria-labelledby]>div:first-child>div[role="button"][tabindex="0"]'].join(','));
        if (media) {
            const socialContext = article.querySelector('[data-testid="socialContext"]');
            if (socialContext) {
                const rawText = socialContext.textContent.trim();
                const lastSpaceIndex = rawText.lastIndexOf(' ');
                retweeter_name = lastSpaceIndex !== -1 ? rawText.substring(0, lastSpaceIndex).trim() : rawText;
                const href = socialContext.closest('a')?.getAttribute('href');
                retweeter_id = href ? href.replace('/', '') : '';
            }

            const group = article.querySelector('div[role="group"]:last-of-type, ul.tweet-actions, ul.tweet-detail-actions');
            if (status_id && group) {
                const shareCandidates = Array.from(group.querySelectorAll(':scope>div>div, li.tweet-action-item>a, li.tweet-detail-action-item>a'));
                const lastShare = shareCandidates.pop();
                if (lastShare && lastShare.parentNode) {
                    const btn_share = lastShare.parentNode;
                    const btn_down = btn_share.cloneNode(true);

                    btn_down.querySelector('button')?.removeAttribute('disabled');
                    const svg = btn_down.querySelector('svg');
                    if (svg) svg.innerHTML = Config.svg;

                    const is_exist = this.app.storage.isDownloaded(status_id);
                    btn_down.classList.add('tmd-down');
                    this.setButtonStatus(btn_down, is_exist ? 'exist' : 'download', is_exist ? this.lang.completed : this.lang.download);

                    btn_share.parentNode.insertBefore(btn_down, btn_share.nextSibling);
                    btn_down.onclick = (e) => {
                        e && e.preventDefault && e.preventDefault();
                        e && e.stopPropagation && e.stopPropagation();
                        this.app.handleDownloadClick(btn_down, status_id, null, retweeter_name, retweeter_id);
                        this.tryClickBookmark(article);
                    };
                }
            }
        }

        const imgs = article.querySelectorAll('a[href*="/photo/"]');
        if (imgs.length > 1) {
            if (!status_id) return;

            imgs.forEach(img => {
                const index = img.href.split('/status/').pop().split('/').pop();
                const btn_down = this.createMediaDownloadBtn('tmd-img', 'download', this.lang.download);
                img.parentNode.appendChild(btn_down);

                btn_down.onclick = e => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.app.handleDownloadClick(btn_down, status_id, index, retweeter_name, retweeter_id);
                    this.tryClickBookmark(article);
                };
            });
        }
    }

    addButtonsToMediaList(listitems) {
        listitems.forEach(li => {
            if (!li || this.processedListItems.has(li)) return;
            const statusLink = li.querySelector('a[href*="/status/"]');
            if (!statusLink || !statusLink.href) return;
            this.processedListItems.add(li);

            const status_id = this.extractStatusId(statusLink.href);
            if (!status_id) return;

            const is_exist = this.app.storage.isDownloaded(status_id);
            const btn_down = this.createMediaDownloadBtn(
                'tmd-media',
                is_exist ? 'exist' : 'download',
                is_exist ? this.lang.completed : this.lang.download
            );

            li.appendChild(btn_down);
            btn_down.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.app.handleDownloadClick(btn_down, status_id, null);
            };
        });
    }
}

class TwitterMediaDownloaderApp {
    constructor() {
        this.env = EnvDetect.detect();
        this.storage = new StorageManager();
        this.downloader = new Downloader(this.env, this.storage);
        this.queue = new DownloadQueue(this.env, this.downloader);
        this.ui = new UIManager(this);
        this._pendingNodes = new Set();
        this._flushScheduled = false;
    }

    async init() {
        QueryIdResolver.installNetworkHook();
        await this.storage.init();
        this.ui.lang = this.ui.getLang();
        this.ui.injectCSS();
        this.ui.renderHistoryUI();

        if (!this.env.isMobile) {
            document.addEventListener('mouseover', e => {
                let container = e.target.closest('article') || e.target.closest('[role="dialog"]') || e.target.closest('div[aria-labelledby]');
                if (container) window.tmdHoveredContainer = container;
            });

            document.addEventListener('keydown', e => {
                if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return;
                if (this.storage.shortcutKey && e.key.toUpperCase() === this.storage.shortcutKey.toUpperCase()) {
                    let container = window.tmdHoveredContainer;
                    if (!container || !document.body.contains(container)) {
                        container = document.querySelector('[role="dialog"]') || document.querySelector('article');
                    }
                    if (container) {
                        const btn = container.querySelector('.tmd-img:hover') || container.querySelector('.tmd-media:hover') || container.querySelector('.tmd-down');
                        if (btn && !btn.classList.contains('loading')) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (typeof btn.onclick === 'function') btn.onclick(e);
                            else btn.click();
                        }
                    }
                }
            });
        }

        this.startObserver();

        console.debug('[TMD] env', {
            version: Config.VERSION,
            isMobile: this.env.isMobile,
            hasGMDownload: this.env.hasGMDownload,
            maxThread: this.env.maxThread,
            queryId: this.storage.queryId,
            bearerCached: !!(this.storage.bearer && this.storage.bearer !== Config.AUTH_TOKEN)
        });
    }

    findObserveRoot() {
        return document.querySelector('[data-testid="primaryColumn"]')
            || document.querySelector('main[role="main"]')
            || document.body;
    }

    startObserver() {
        const processNode = (node) => {
            if (!node || node.nodeType !== 1) return;
            if (node.tagName === 'ARTICLE') {
                this.ui.addButtonsToArticle(node);
            } else {
                const ancestor = node.closest && node.closest('article');
                if (ancestor) this.ui.addButtonsToArticle(ancestor);
                if (node.querySelectorAll) {
                    node.querySelectorAll('article').forEach(a => this.ui.addButtonsToArticle(a));
                }
            }
            const listitems = node.tagName === 'LI' && node.getAttribute('role') === 'listitem' && [node] || node.tagName === 'DIV' && node.querySelectorAll('li[role="listitem"]');
            if (listitems && listitems.length) this.ui.addButtonsToMediaList(Array.from(listitems));
        };

        const flush = () => {
            this._flushScheduled = false;
            const nodes = Array.from(this._pendingNodes);
            this._pendingNodes.clear();
            nodes.forEach(processNode);
        };

        const schedule = (node) => {
            this._pendingNodes.add(node);
            if (!this._flushScheduled) {
                this._flushScheduled = true;
                requestAnimationFrame(flush);
            }
        };

        const attach = (root) => {
            new MutationObserver(ms => {
                ms.forEach(m => m.addedNodes.forEach(node => schedule(node)));
            }).observe(root, { childList: true, subtree: true });
            root.querySelectorAll && root.querySelectorAll('article').forEach(a => this.ui.addButtonsToArticle(a));
        };

        let root = this.findObserveRoot();
        attach(root);

        if (root !== document.body) {
            const reattach = new MutationObserver(() => {
                const next = this.findObserveRoot();
                if (next && next !== root && next !== document.body) {
                    root = next;
                    attach(root);
                    reattach.disconnect();
                }
            });
            reattach.observe(document.body, { childList: true, subtree: true });
        }
    }

    async handleDownloadClick(btn, status_id, index, retweeter_name = 'unknown', retweeter_id = 'unknown') {
        if (btn.classList.contains('loading')) return;
        this.ui.setButtonStatus(btn, 'loading');

        const out = (this.storage.filenamePattern || Config.defaultFilename).split('\n').join('');

        let tweet;
        try {
            tweet = await TwitterAPI.fetchTweetJson(status_id, this.storage);
        } catch (e) {
            const code = (e && e.code) || 'API_ERROR';
            this.ui.setButtonStatus(btn, 'failed', this.ui.errorText(code));
            return;
        }

        if (!tweet || !tweet.legacy) {
            this.ui.setButtonStatus(btn, 'failed', this.ui.errorText('API_ERROR'));
            return;
        }

        const userResult = tweet.core?.user_results?.result || {};
        let user = userResult.legacy || userResult.core || userResult;
        user = {
            screen_name: user.screen_name || user.username || 'unknown',
            name: user.name || 'unknown'
        };

        const invalid = Utils.getInvalidChars();
        const datetime = Utils.extractDateTimeFormat(out, invalid);
        const textLength = Utils.extractFullTextLength(out);

        const fullTextRaw = TweetUnwrapper.getFullText(tweet);

        const info = {
            'status-id': status_id,
            'user-id': user.screen_name || 'unknown',
            'fav-count': tweet.legacy.favorite_count || 0,
            'user-name': Utils.sanitizeFilenamePart(user.name || 'unknown', invalid),
            'date-time': Utils.formatDate(tweet.legacy.created_at, datetime),
            'date-time-local': Utils.formatDate(tweet.legacy.created_at, datetime, true),
            'full-text': Utils.sanitizeFilenamePart(
                (fullTextRaw || '').replace(/\s*https:\/\/t\.co\/\w+/g, '').replaceAll(/\n+/g, '\n'),
                invalid
            ).substring(0, textLength),
            'rt-user-name': Utils.sanitizeFilenamePart(retweeter_name, invalid),
            'rt-user-id': retweeter_id || 'unknown'
        };

        let medias = TweetUnwrapper.getMedias(tweet);
        info['media-count'] = medias.length;

        if (index) {
            const idx = parseInt(index, 10) - 1;
            medias = medias[idx] ? [medias[idx]] : [];
        }

        if (medias.length === 0) {
            this.ui.setButtonStatus(btn, 'failed', this.ui.errorText('MEDIA_NOT_FOUND'));
            return;
        }

        let successCount = 0;
        let failCount = 0;
        const total = medias.length;
        const toastMsg = this.ui.lang.toast_open_url;

        const checkDone = () => {
            if (successCount + failCount < total) return;
            if (successCount > 0) {
                this.ui.setButtonStatus(btn, 'completed', this.ui.lang.completed);
                this.persistHistoryAfterDownload(status_id, info, medias, tweet);
            } else {
                this.ui.setButtonStatus(btn, 'failed', this.ui.errorText('ERROR'));
            }
        };

        medias.forEach((media, i) => {
            const picked = TweetUnwrapper.pickMediaUrl(media);
            if (!picked || !picked.primary) {
                failCount++;
                checkDone();
                return;
            }

            if (picked.maybeHls) {
                failCount++;
                checkDone();
                return;
            }

            const mediaUrl = picked.primary;
            const file = mediaUrl.split('/').pop().split(/[:?]/)[0];
            const fileName = file.split('.')[0];
            const fileExt = file.split('.').pop() || (media.type === 'photo' ? 'jpg' : 'mp4');
            const fileType = (media.type || 'photo').replace('animated_', '');
            const mediaIndex = index ? index : (i + 1);

            const fileInfo = {
                ...info,
                url: mediaUrl,
                file,
                'file-name': fileName,
                'file-ext': fileExt,
                'file-type': fileType,
                index: mediaIndex
            };

            const indexSuffix = ((medias.length > 1 || index) && !out.includes('{index}') && !out.includes('{file-name}'))
                ? ('-' + mediaIndex)
                : '';
            const outName = Utils.buildFilename(out, fileInfo, { indexSuffix });

            const tryUrls = [mediaUrl, ...(picked.fallbacks || [])];
            let urlIndex = 0;

            const enqueue = (url) => {
                this.queue.add({
                    url,
                    name: outName,
                    isVideo: !!picked.isVideo || fileType === 'video' || fileType === 'gif',
                    toastMsg,
                    onload: () => {
                        successCount++;
                        checkDone();
                    },
                    onerror: () => {
                        urlIndex++;
                        if (urlIndex < tryUrls.length) {
                            enqueue(tryUrls[urlIndex]);
                        } else {
                            failCount++;
                            checkDone();
                        }
                    }
                });
            };
            enqueue(tryUrls[0]);
        });
    }

    async persistHistoryAfterDownload(status_id, info, medias, tweet) {
        if (!this.storage.saveHistoryFlag) return;
        if (this.storage.isDownloaded(status_id)) return;

        await this.storage.addHistory({
            id: status_id,
            user: info['user-name'],
            type: medias.length > 1 ? 'Gallery' : info['file-type'],
            postTime: new Date(tweet.legacy.created_at).getTime(),
            thumb: medias[0]?.media_url_https ? medias[0].media_url_https + ':small' : ''
        });
        this.ui.updateHistoryCount();
    }
}

new TwitterMediaDownloaderApp().init();
