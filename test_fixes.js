// Quick test script to verify both fixes
// Run this in browser console after the app loads

async function testLikesAndPlayback() {
    console.log('🧪 Testing Likes and Playback Fixes...');
    
    // Test 1: Check if like status loads properly
    console.log('\n📍 TEST 1: Like Status Loading');
    const songElements = document.querySelectorAll('[data-song-id]');
    console.log(`Found ${songElements.length} songs in UI`);
    
    if (songElements.length > 0) {
        const firstSong = songElements[0];
        const songId = firstSong.dataset.songId;
        console.log(`Checking like status for song: ${songId}`);
        
        if (window.likesService && window.authService && window.authService.isAuthenticated()) {
            try {
                const status = await window.likesService.getLikeStatus(songId);
                console.log('Like status result:', status);
                
                const likeBtn = firstSong.querySelector('.like-song-btn');
                if (likeBtn) {
                    const icon = likeBtn.querySelector('i');
                    console.log('Like button found:', !!likeBtn);
                    console.log('Icon classes:', icon ? icon.className : 'no icon');
                }
            } catch (error) {
                console.error('Error getting like status:', error);
            }
        } else {
            console.log('⚠️ Not authenticated or likes service not available');
        }
    }
    
    // Test 2: Player state consistency
    console.log('\n📍 TEST 2: Player State');
    if (window.chakrasPlayer && window.chakrasPlayer.audioPlayer) {
        const player = window.chakrasPlayer.audioPlayer;
        console.log('Current song:', player.currentSong ? player.currentSong.title : 'none');
        console.log('Current playlist length:', player.playlist.length);
        console.log('Current index:', player.currentIndex);
        console.log('Is playing:', player.isPlaying);
        
        // Check if current song is in current playlist
        if (player.currentSong) {
            const songInPlaylist = player.playlist.find(s => s.id === player.currentSong.id);
            console.log('Current song in playlist:', !!songInPlaylist);
        }
    }
    
    console.log('\n✅ Test completed. Check the logs above for any issues.');
}

// Auto-run test
setTimeout(testLikesAndPlayback, 2000);
