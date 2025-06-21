// Test script to verify frontend likes functionality
const puppeteer = require('puppeteer');
const path = require('path');

async function testLikes() {
    console.log('🧪 Testing frontend likes functionality...');
    
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    try {
        const page = await browser.newPage();
        
        // Navigate to the frontend
        const frontendPath = `file://${path.join(__dirname, 'frontend', 'index.html')}`;
        console.log('📂 Opening:', frontendPath);
        await page.goto(frontendPath);
        
        // Wait for the page to load
        await page.waitForTimeout(2000);
        
        // Check if auth service is available
        const authServiceExists = await page.evaluate(() => {
            return typeof window.authService !== 'undefined';
        });
        
        console.log('🔑 Auth service loaded:', authServiceExists);
        
        // Login with test credentials
        console.log('🔐 Attempting to login...');
        const loginResult = await page.evaluate(async () => {
            if (window.authService) {
                try {
                    const result = await window.authService.login('test', 'test123');
                    return result;
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }
            return { success: false, error: 'Auth service not available' };
        });
        
        console.log('🔑 Login result:', loginResult);
        
        // Check if likes service is available
        const likesServiceExists = await page.evaluate(() => {
            return typeof window.likesService !== 'undefined';
        });
        
        console.log('❤️ Likes service loaded:', likesServiceExists);
        
        // Wait for music library to load
        await page.waitForTimeout(3000);
        
        // Check if songs are loaded
        const songsLoaded = await page.evaluate(() => {
            const songRows = document.querySelectorAll('.song-row');
            return songRows.length > 0;
        });
        
        console.log('🎵 Songs loaded:', songsLoaded, 'songs found');
        
        if (songsLoaded && loginResult.success) {
            // Try to like the first song
            console.log('❤️ Testing like functionality...');
            const likeResult = await page.evaluate(async () => {
                try {
                    const firstLikeBtn = document.querySelector('.like-song-btn');
                    if (firstLikeBtn) {
                        const songId = firstLikeBtn.dataset.songId;
                        console.log('Clicking like button for song:', songId);
                        firstLikeBtn.click();
                        return { success: true, songId };
                    }
                    return { success: false, error: 'No like button found' };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            });
            
            console.log('❤️ Like test result:', likeResult);
            
            // Wait a bit and check if the UI updated
            await page.waitForTimeout(2000);
            
            const uiUpdated = await page.evaluate(() => {
                const firstLikeBtn = document.querySelector('.like-song-btn');
                return firstLikeBtn ? firstLikeBtn.classList.contains('liked') : false;
            });
            
            console.log('🎨 UI updated after like:', uiUpdated);
        }
        
        // Keep browser open for manual inspection
        console.log('🔍 Browser will stay open for manual inspection...');
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        // await browser.close();
    }
}

// Run if puppeteer is available
try {
    testLikes();
} catch (error) {
    console.log('📝 Puppeteer not available. Please test manually:');
    console.log('1. Open the frontend in your browser');
    console.log('2. Login with username: test, password: test123');
    console.log('3. Try clicking like buttons on songs');
    console.log('4. Check browser console for any errors');
}
