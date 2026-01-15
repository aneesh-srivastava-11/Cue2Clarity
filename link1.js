async function askStudentAI() {
    const question = document.getElementById('userInput').value;
    const chatContainer = document.getElementById('chatContainer');

    try {
        const response = await fetch('http://127.0.0.1:8000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: question }),
        });

        if (!response.ok) throw new Error('Backend is not responding');

        const data = await response.json();

        // 1. Display the AI Answer
        const answerHtml = `
            <div class="ai-response">
                <p>${data.answer}</p>
            </div>
        `;
        
        // 2. Display clickable Source Links
        let sourcesHtml = '';
        if (data.sources && data.sources.length > 0) {
            sourcesHtml = '<div class="sources"><strong>Sources:</strong><ul>';
            data.sources.forEach(src => {
                sourcesHtml += `<li><a href="${src.url}" target="_blank">${src.name}</a></li>`;
            });
            sourcesHtml += '</ul></div>';
        }

        chatContainer.innerHTML += answerHtml + sourcesHtml;

    } catch (error) {
        console.error('Error:', error);
        chatContainer.innerHTML += `<p style="color:red">Error connecting to AI: ${error.message}</p>`;
    }
}