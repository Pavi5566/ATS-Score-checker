document.getElementById('atsForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get job description text
    const jobDescriptionText = document.getElementById('jobDescription').value;

    // Get the uploaded resume file
    const resumeFile = document.getElementById('resumeFile').files[0];
    
    if (resumeFile) {
        // Parse resume file based on its type
        if (resumeFile.type === 'application/pdf') {
            parsePDF(resumeFile, function(resumeText) {
                processResume(resumeText, jobDescriptionText);
            });
        } else if (resumeFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            parseWord(resumeFile, function(resumeText) {
                processResume(resumeText, jobDescriptionText);
            });
        } else {
            alert('Please upload a valid PDF or Word document.');
        }
    } else {
        alert('Please upload your resume.');
    }
});

function processResume(resumeText, jobDescriptionText) {
    // Calculate ATS Score
    const atsScore = calculateATSScore(resumeText, jobDescriptionText);
    
    // Display ATS Score
    const atsResult = document.getElementById('atsScoreResult');
    atsResult.textContent = `ATS Score: ${atsScore}%`;

    // Classify as pass or fail based on ATS score
    if (atsScore >= 70) {
        atsResult.classList.add('pass');
        atsResult.classList.remove('fail');
    } else {
        atsResult.classList.add('fail');
        atsResult.classList.remove('pass');
    }

    // Provide feedback on resume
    provideFeedback(resumeText, jobDescriptionText);
}

function calculateATSScore(resumeText, jobDescriptionText) {
    let score = 0;
    
    // Extract Keywords from job description and match them with resume
    const jobKeywords = extractKeywords(jobDescriptionText);
    jobKeywords.forEach(keyword => {
        if (resumeText.toLowerCase().includes(keyword)) {
            score += 5;
        }
    });

    // Check for proper resume structure (essential sections)
    if (resumeText.includes('skills')) score += 20;
    if (resumeText.includes('experience')) score += 20;
    if (resumeText.includes('education')) score += 20;
    if (resumeText.includes('summary')) score += 20;

    // Max out score at 100
    return Math.min(score, 100);
}

function extractKeywords(text) {
    const commonSkills = ['java', 'javascript', 'python', 'nodejs', 'html', 'css', 'sql', 'aws', 'docker', 'leadership', 'project management'];
    const textLower = text.toLowerCase();
    const foundKeywords = commonSkills.filter(skill => textLower.includes(skill));
    return foundKeywords;
}

function provideFeedback(resumeText, jobDescriptionText) {
    const feedbackDiv = document.getElementById('feedback');
    feedbackDiv.innerHTML = ''; // Clear previous feedback

    let feedback = [];

    // Check for missing keywords in the job description
    const jobKeywords = jobDescriptionText.split(' ');
    jobKeywords.forEach(keyword => {
        if (!resumeText.toLowerCase().includes(keyword.toLowerCase())) {
            feedback.push(`Missing keyword: "${keyword}"`);
        }
    });

    // Check for missing sections in the resume (skills, experience, education, summary)
    if (!resumeText.includes('skills')) feedback.push('Consider adding a "Skills" section.');
    if (!resumeText.includes('experience')) feedback.push('Consider adding an "Experience" section.');
    if (!resumeText.includes('education')) feedback.push('Consider adding an "Education" section.');
    if (!resumeText.includes('summary')) feedback.push('Consider adding a "Professional Summary".');

    // Display feedback
    if (feedback.length === 0) {
        feedbackDiv.innerHTML = 'Your resume looks ATS-compliant! No improvements needed.';
    } else {
        feedbackDiv.innerHTML = feedback.join('<br>');
    }
}

function parsePDF(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const pdfData = new Uint8Array(e.target.result);
        pdfjsLib.getDocument(pdfData).promise.then(function(pdfDoc_) {
            let text = '';
            const numPages = pdfDoc_.numPages;
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                pdfDoc_.getPage(pageNum).then(function(page) {
                    page.getTextContent().then(function(textContent) {
                        text += textContent.items.map(item => item.str).join(' ');
                        if (pageNum === numPages) {
                            callback(text);
                        }
                    });
                });
            }
        });
    };
    reader.readAsArrayBuffer(file);
}

function parseWord(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        const options = { convertImage: mammoth.images.imgElement };
        mammoth.extractRawText({ arrayBuffer: arrayBuffer })
            .then(function(result) {
                callback(result.value);
            });
    };
    reader.readAsArrayBuffer(file);
}
