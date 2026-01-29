const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const axios = require('axios');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const cors = require('cors');
const express = require('express');
const app = express();
app.use(cors());
app.use(express.json());

registerFont('./Gotham-Bold.ttf', { 
  family: 'Montserrat', 
  weight: 'bold',
  style: 'normal'
})

app.use((req, res, next) => {
    console.log('🌐 INCOMING REQUEST:');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('---');
    next();
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

app.get('/', (req, res) => {
    res.json({ 
        status: 'online', 
        message: 'Donation server is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

function getDonationEmoji(amount) {
    if (amount >= 10000) return '<:starfall:1413292844575227944>';
    if (amount >= 1000) return '<:smite:1413292959213944882>';
    if (amount >= 100) return '<:Nuke:1413293038528106566>';
    if (amount >= 10) return '<:blimp:1413292777076293673>';
    if (amount >= 5) return '<:sign:1435629258566406164>';
    return '<:sign:1435629258566406164>';
}

function formatCommas(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getColor(robux) {
    if (robux >= 10000) return '#FB0505';
    if (robux >= 1000) return '#EF1085';
    if (robux >= 100) return '#FA04F2';
    if (robux >= 10) return '#01d9FF';
    if (robux >= 5) return '#FF8801';
    return '#00FF00';
}

async function getRobloxThumbnail(userId) {
    try {
        console.log(`🔄 Fetching thumbnail for user: ${userId}`);
        const response = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
        
        if (response.data.data && response.data.data[0] && response.data.data[0].imageUrl) {
            const avatarUrl = response.data.data[0].imageUrl;
            console.log(`✅ Got avatar URL: ${avatarUrl}`);
            return avatarUrl;
        } else {
            console.log(`❌ No avatar found for user ${userId}, using fallback`);
        }
    } catch (error) {
        console.log(`❌ Error fetching avatar for ${userId}:`, error.message);
    }
    
    // Fallback URL
    const fallbackUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`;
    console.log(`🔄 Using fallback URL: ${fallbackUrl}`);
    return fallbackUrl;
}

async function createDonationImage(donatorAvatar, raiserAvatar, donatorName, raiserName, amount) {
    try {
        const canvas = createCanvas(2048, 512);
        const ctx = canvas.getContext('2d');
        const donationColor = getColor(amount);
        ctx.clearRect(0, 0, 2048, 512);


        const canvasWidth = 2048;
        const canvasHeight = 514;
        const scaleX = canvasWidth / 700;   // 2048 ÷ 700 ≈ 2.926
        const scaleY = canvasHeight / 200;  // 514 ÷ 200 ≈ 2.57
        const scale = Math.min(scaleX, scaleY); // Use smallest for consistent scaling
        
        // Helper function to scale positions
        const scalePos = (x, y) => ({ x: x * scaleX, y: y * scaleY });
        // --- 1. IMPROVED BACKGROUND GRADIENTS ---
        // 
      if (amount >= 1000 && amount < 10000) {
    // The gradient runs from 350 down to the bottom (514)
    const glow = ctx.createLinearGradient(0, 350, 0, 514);

    glow.addColorStop(0, donationColor + '00'); // Transparent at top
    glow.addColorStop(1, donationColor + '25'); // Pink/Color at bottom

    ctx.fillStyle = glow;
    
    // Changing 150 to 164 ensures it touches the very bottom edge
    ctx.fillRect(0, 350, 2048, 164); 
}
        // 10M+ Version (The Red One): Solid top/bottom, Faded center
        // 
if (amount >= 10000) {
    const glow = ctx.createLinearGradient(0, 40, 0, 514);
    
    glow.addColorStop(0, donationColor + '00'); 
    glow.addColorStop(0.3, donationColor + '20'); 
    glow.addColorStop(0.7, donationColor + '60'); 
    glow.addColorStop(1, donationColor + '65'); 
    
    ctx.fillStyle = glow;
    
    // 40 (start) + 474 (height) = 514 (perfect bottom)
    ctx.fillRect(0, 40, 2048, 474); 
}
        const donatorImg = await loadImage(donatorAvatar);
        const raiserImg = await loadImage(raiserAvatar);

        // --- 2. AVATAR CONFIGURATION ---
        const avatarRadius = 135;
        const avatarY = 195; 
        const donatorX = 395; 
        const raiserX = 1658; 

        // Donator Avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(donatorX, avatarY, avatarRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(donatorImg, donatorX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.restore();

        // Raiser Avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(raiserX, avatarY, avatarRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(raiserImg, raiserX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.restore();

        // Avatar Borders
        ctx.strokeStyle = donationColor;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(donatorX, avatarY, avatarRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(raiserX, avatarY, avatarRadius, 0, Math.PI * 2);
        ctx.stroke();

        // --- 3. NAME TEXT ---
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 50px Montserrat';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 17;
        ctx.strokeText(`@${donatorName}`, donatorX, 420);
        ctx.fillText(`@${donatorName}`, donatorX, 420);
        ctx.strokeText(`@${raiserName}`, raiserX, 420);
        ctx.fillText(`@${raiserName}`, raiserX, 420);

        // --- 4. ROBX ICON & AMOUNT ---
        // Adjust these to change price appearance
        const amountFontSize = 130;   
        const amountY = 200;          
        const iconSize = 130;         
        const amountStrokeWidth = 16;

        ctx.fillStyle = donationColor; 
        ctx.font = `bold ${amountFontSize}px Montserrat`;
        ctx.strokeStyle = '#000000'; 
        ctx.lineWidth = amountStrokeWidth;
        
        try {
   const robuxImage = await loadImage(path.join(__dirname, 'robuxIcon.png'));
            const text = `${formatCommas(amount)}`;
            const textWidth = ctx.measureText(text).width;
            const spacing = 15;
            const centerX = 1000;

            const totalWidth = iconSize + spacing + textWidth;
            const startX = centerX - (totalWidth / 2);
            
            const iconX = startX;
            const textX = startX + iconSize + spacing + (textWidth / 2);
            const iconY = amountY - (iconSize / 1.2); 

            // Create Tinted Icon
            const tempCanvas = createCanvas(iconSize, iconSize);
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(robuxImage, 0, 0, iconSize, iconSize);
            tempCtx.globalCompositeOperation = 'source-in';
            tempCtx.fillStyle = donationColor;
            tempCtx.fillRect(0, 0, iconSize, iconSize);

            // Draw Hexagonal Stroke
            ctx.save();
            const s = 6; // Thin stroke to match text
            const maskCanvas = createCanvas(iconSize, iconSize);
            const maskCtx = maskCanvas.getContext('2d');
            maskCtx.drawImage(robuxImage, 0, 0, iconSize, iconSize);
            maskCtx.globalCompositeOperation = 'source-in';
            maskCtx.fillStyle = '#000000';
            maskCtx.fillRect(0, 0, iconSize, iconSize);

            for(let dx = -s; dx <= s; dx += s) {
                for(let dy = -s; dy <= s; dy += s) {
                    if (dx === 0 && dy === 0) continue;
                    ctx.drawImage(maskCanvas, iconX + dx, iconY + dy);
                }
            }
            
            ctx.drawImage(tempCanvas, iconX, iconY);
            ctx.strokeText(text, textX, amountY);
            ctx.fillText(text, textX, amountY);
            ctx.restore();
            
        } catch (e) {
            console.log("Error rendering icon:", e);
        }

        // --- 5. "DONATED TO" TEXT ---
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 95px Montserrat';
        ctx.lineWidth = 14;
        ctx.strokeText('donated to', 1024, 325); 
        ctx.fillText('donated to', 1024, 325);

        return canvas.toBuffer();
    } catch (error) {
        console.error("Critical error in createDonationImage:", error);
        throw error;
    }
}

app.post('/donation', async (req, res) => {
    console.log('📥 FULL REQUEST RECEIVED:');
    console.log('Body:', req.body);
    
    const { DonatorId, RaiserId, DonatorName, RaiserName, Amount } = req.body;
    
    // Always use the real Roblox ID and name
    const donatorAvatarId = DonatorId;
    const raiserAvatarId = RaiserId;

    // Remove the "@" if present, but keep real names
    const donatorDisplayName = DonatorName.replace('@', '');
    const raiserDisplayName = RaiserName.replace('@', '');
    
    console.log('👤 Processed names:');
    console.log('- Donator:', donatorDisplayName);
    console.log('- Raiser:', raiserDisplayName);
    
    try {
        const donatorAvatar = await getRobloxThumbnail(donatorAvatarId);
        const raiserAvatar = await getRobloxThumbnail(raiserAvatarId);
        
        const imageBuffer = await createDonationImage(
            donatorAvatar, 
            raiserAvatar, 
            donatorDisplayName, 
            raiserDisplayName, 
            Amount
        );

        const attachment = new AttachmentBuilder(imageBuffer, { name: 'donation.png' });

        const channel = await client.channels.fetch('1368454360710905961');
        await channel.send({
            content: `${getDonationEmoji(Amount)} \`@${donatorDisplayName}\` donated **<:robuxok:1435629815079370902>${formatCommas(Amount)} Robux** to \`@${raiserDisplayName}\``,
            embeds: [{
                color: parseInt(getColor(Amount).replace('#', ''), 16),
                image: { url: "attachment://donation.png" },
                timestamp: new Date().toISOString(),
                footer: { text: "Donated on" }
            }],
            files: [attachment]
        });
        
        console.log('✅ Donation processed successfully');
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error processing donation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


client.on('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});
// commit pls
const PORT = 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP server running on port ${PORT}`);
});

client.login(process.env.TOKEN);
