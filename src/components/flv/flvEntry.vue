<template>
    <div class="flv-entry">
        <h1>FLV 播放器</h1>
        <button @click="goBack" class="back-button">返回首页</button>
        <div class="video-container">
            <video id="videoElement" controls width="800" height="450"></video>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
    router.push('/')
}
</script>

<style scoped>
.flv-entry {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    gap: 20px;
    background-color: #1e1e1e;
    color: #cccccc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    min-height: 100vh;
}

.flv-entry h1 {
    font-size: 28px;
    font-weight: 300;
    margin: 0;
    color: #ffffff;
}

.back-button {
    padding: 8px 16px;
    font-size: 13px;
    background-color: #3c3c3c;
    color: #ffffff;
    border: 1px solid #3c3c3c;
    border-radius: 2px;
    cursor: pointer;
    transition: background-color 0.15s;
    font-weight: 400;
}

.back-button:hover {
    background-color: #4c4c4c;
    border-color: #4c4c4c;
}

.back-button:active {
    background-color: #3c3c3c;
}

.video-container {
    margin-top: 20px;
    background-color: #252526;
    padding: 20px;
    border-radius: 2px;
    border: 1px solid #3c3c3c;
}

.video-container video {
    background-color: #000000;
    border-radius: 2px;
}
</style>
