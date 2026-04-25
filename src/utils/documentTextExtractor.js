import { supabase } from '../supabaseClient';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Background text extraction service
export class DocumentTextExtractor {
	constructor() {
		this.queue = [];
		this.processing = false;
		this.maxRetries = 3;
	}

	// Add document to extraction queue
	async queueTextExtraction(documentData) {
		console.log(`📝 Queuing text extraction for: ${documentData.fileName}`);
		this.queue.push(documentData);
		if (!this.processing) {
			this.processQueue();
		}
	}

	// Process the extraction queue
	async processQueue() {
		if (this.processing || this.queue.length === 0) return;
		this.processing = true;
		console.log(`🔄 Processing text extraction queue (${this.queue.length} items)`);
		while (this.queue.length > 0) {
			const documentData = this.queue.shift();
			try {
				await this.extractAndUpdateText(documentData);
			} catch (error) {
				console.error(`❌ Failed to extract text from ${documentData.fileName}:`, error);
			}
		}
		this.processing = false;
		console.log('✅ Text extraction queue processing completed');
	}

	// Extract text from document and update database
	async extractAndUpdateText(documentData, retryCount = 0) {
		try {
			console.log(`📖 Extracting text from: ${documentData.fileName}`);
			const startTime = Date.now();
			let extractedText = '';
			const fileExt = documentData.fileType?.toLowerCase();
			if (fileExt === 'pdf') {
				extractedText = await this.extractTextFromPDF(documentData.url);
			} else if (['jpg', 'jpeg', 'png'].includes(fileExt)) {
				extractedText = await this.extractTextFromImage(documentData.url);
			}
			const extractionTime = Date.now() - startTime;
			console.log(`✅ Text extraction completed in ${extractionTime}ms for ${documentData.fileName}`);
			if (extractedText.trim()) {
				await this.updateDocumentText(documentData, extractedText);
				console.log(`💾 Updated text for document: ${documentData.fileName}`);
			}
		} catch (error) {
			console.error(`❌ Text extraction failed for ${documentData.fileName}:`, error);
			// Retry logic
			if (retryCount < this.maxRetries) {
				console.log(`🔄 Retrying text extraction (${retryCount + 1}/${this.maxRetries})`);
				await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
				return this.extractAndUpdateText(documentData, retryCount + 1);
			}
		}
	}

	// Extract text from PDF
	async extractTextFromPDF(pdfUrl) {
		try {
			const response = await fetch(pdfUrl);
			const arrayBuffer = await response.arrayBuffer();
			const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
			let textContent = '';
			for (let i = 1; i <= pdf.numPages; i++) {
				const page = await pdf.getPage(i);
				const textObj = await page.getTextContent();
				textContent += textObj.items.map(item => item.str).join(' ') + '\n';
			}
			return textContent.trim();
		} catch (error) {
			console.error('PDF text extraction error:', error);
			throw error;
		}
	}

	// Extract text from image using OCR
	async extractTextFromImage(imageUrl) {
		try {
			const result = await Tesseract.recognize(imageUrl, 'eng', {
				logger: m => console.log(`OCR Progress: ${m.status} ${m.progress ? (m.progress * 100).toFixed(1) + '%' : ''}`)
			});
			return result.data.text.trim();
		} catch (error) {
			console.error('OCR text extraction error:', error);
			throw error;
		}
	}

	// Update document text in database
	async updateDocumentText(documentData, extractedText) {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				const currentMetadata = user.user_metadata || {};
				const updatedDocuments = {
					...currentMetadata.documents,
					[documentData.documentType]: {
						...documentData,
						extractedText,
						textExtractedAt: new Date().toISOString()
					}
				};
				await supabase.auth.updateUser({
					data: {
						...currentMetadata,
						documents: updatedDocuments
					}
				});
			}
		} catch (error) {
			console.error('Failed to update document text:', error);
			throw error;
		}
	}

	getQueueStatus() {
		return {
			queueLength: this.queue.length,
			isProcessing: this.processing
		};
	}

	clearQueue() {
		this.queue = [];
		this.processing = false;
	}
}

// Create singleton instance
export const documentExtractor = new DocumentTextExtractor();