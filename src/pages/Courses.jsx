import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Courses = () => {
	const [selectedCourse, setSelectedCourse] = useState(null);
	const [courses, setCourses] = useState([]);
	const [showAddModal, setShowAddModal] = useState(false);
	const [newCourse, setNewCourse] = useState({ title: '', description: '', image: '', video: '', price: '', videos: [] });
	const [editCourse, setEditCourse] = useState(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [error, setError] = useState('');
	const [menuOpenId, setMenuOpenId] = useState(null);
	const [imageFile, setImageFile] = useState(null);
	const [videoFile, setVideoFile] = useState(null);
	const [videoPreview, setVideoPreview] = useState(null);
	const [videoFiles, setVideoFiles] = useState([]);
	const [videoPreviews, setVideoPreviews] = useState([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);

	useEffect(() => {
		const fetchCourses = async () => {
			setLoading(true);
			const { data } = await supabase.from('courses').select('*');
			if (data) setCourses(data);
			setLoading(false);
		};
		fetchCourses();
		const checkAdmin = async () => {
			const { data: { session } } = await supabase.auth.getSession();
			if (session?.user) {
				const userRole = session.user.user_metadata?.role?.toLowerCase() || "";
				setIsAdmin(userRole === "admin" || userRole === "advisor");
			}
		};
		checkAdmin();
	}, []);

	const handleImageUpload = async (file) => {
		if (!file) return '';
		const fileExt = file.name.split('.').pop();
		const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
		const { data, error } = await supabase.storage.from('course-images').upload(fileName, file);
		if (error) { setError('Image upload failed'); return ''; }
		return supabase.storage.from('course-images').getPublicUrl(data.path).data.publicUrl;
	};

	const handleVideoUpload = async (file) => {
		if (!file) return '';
		const fileExt = file.name.split('.').pop();
		const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
		const { data, error } = await supabase.storage.from('course-videos').upload(fileName, file);
		if (error) { setError('Video upload failed'); return ''; }
		return supabase.storage.from('course-videos').getPublicUrl(data.path).data.publicUrl;
	};

	const handleAddCourse = async (e) => {
		e.preventDefault();
		setError('');
		setUploading(true);
		let imageUrl = newCourse.image;
		let videoUrl = newCourse.video;
		let adminId = null;
		const { data: { session } } = await supabase.auth.getSession();
		if (session?.user) adminId = session.user.id;
		if (imageFile) { imageUrl = await handleImageUpload(imageFile); if (!imageUrl) { setError('Image upload failed.'); return; } }
		if (videoFile) { videoUrl = await handleVideoUpload(videoFile); if (!videoUrl) { setError('Video upload failed.'); return; } }
		let videosUrls = [];
		for (const file of videoFiles) { const url = await handleVideoUpload(file); if (url) videosUrls.push(url); }
		if (!newCourse.title || !newCourse.description) { setError('Title and description are required.'); return; }
		const { error } = await supabase.from('courses').insert([{ ...newCourse, image: imageUrl, video: videoUrl, videos: videosUrls, price: newCourse.price || null, admin_id: adminId }]);
		if (error) { setError(error.message); } else {
			const { data: updated } = await supabase.from('courses').select('*');
			setCourses(updated || []);
			setShowAddModal(false);
			setNewCourse({ title: '', description: '', image: '', video: '', price: '', videos: [] });
			setImageFile(null); setVideoFile(null); setVideoPreview(null); setVideoFiles([]); setVideoPreviews([]);
		}
		setUploading(false);
	};

	const handleEditCourse = (course) => { setEditCourse(course); setShowAddModal(false); setVideoFiles([]); setVideoPreviews([]); setImageFile(null); setVideoFile(null); setVideoPreview(null); };

	const handleUpdateCourse = async (e) => {
		e.preventDefault();
		setError('');
		setUploading(true);
		let imageUrl = editCourse.image;
		let videoUrl = editCourse.video;
		if (imageFile) imageUrl = await handleImageUpload(imageFile);
		if (videoFile) videoUrl = await handleVideoUpload(videoFile);
		let uploadedVideoUrls = editCourse.videos || [];
		for (const file of videoFiles) { const url = await handleVideoUpload(file); if (url) uploadedVideoUrls.push(url); }
		if (!editCourse.title || !editCourse.description) { setError('Title and description are required.'); setUploading(false); return; }
		const { error } = await supabase.from('courses').update({ title: editCourse.title, description: editCourse.description, image: imageUrl, video: videoUrl, price: editCourse.price || null, videos: uploadedVideoUrls }).eq('id', editCourse.id);
		if (error) { setError(error.message); } else {
			const { data: updated } = await supabase.from('courses').select('*');
			setCourses(updated || []);
			setEditCourse(null); setImageFile(null);
		}
		setUploading(false);
	};

	const handleDeleteCourse = async (id) => {
		const { error } = await supabase.from('courses').delete().eq('id', id);
		if (error) { setError(error.message); } else {
			const { data: updated } = await supabase.from('courses').select('*');
			setCourses(updated || []);
		}
	};

	const ModalShell = ({ title, onClose, children }) => (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
			<div className="bg-white rounded-3xl shadow-card-xl w-full max-w-md relative flex flex-col animate-scale-in" style={{ maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
				<div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
					<h2 className="text-lg font-bold text-slate-900">{title}</h2>
					<button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
					</button>
				</div>
				<div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
			</div>
		</div>
	);

	const FormInput = ({ label, ...props }) => (
		<div className="flex flex-col gap-1.5">
			{label && <label className="input-label">{label}</label>}
			<input className="input" {...props} />
		</div>
	);

	const CourseForm = ({ data, onChange, onSubmit, isEdit }) => (
		<form onSubmit={onSubmit} className="flex flex-col gap-4">
			<FormInput label="Course Title" type="text" placeholder="e.g. Study Abroad Masterclass" value={data.title} onChange={e => onChange({ ...data, title: e.target.value })} required />
			<div className="flex flex-col gap-1.5">
				<label className="input-label">Description</label>
				<textarea className="input min-h-[80px] resize-none" placeholder="What will students learn?" value={data.description} onChange={e => onChange({ ...data, description: e.target.value })} required />
			</div>
			<FormInput label="Price (USD)" type="number" step="0.01" placeholder="Leave empty for free" value={data.price || ''} onChange={e => onChange({ ...data, price: e.target.value })} />
			<div className="flex flex-col gap-1.5">
				<label className="input-label">Thumbnail Image</label>
				<input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="block text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer" />
				{imageFile && <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-32 object-cover rounded-xl mt-1" />}
				{!imageFile && isEdit && data.image && <img src={data.image} alt="Current" className="w-full h-32 object-cover rounded-xl mt-1 opacity-70" />}
			</div>
			<div className="flex flex-col gap-1.5">
				<label className="input-label">Preview Video</label>
				<input type="file" accept="video/*" onChange={e => { const f = e.target.files[0]; if (f) { setVideoFile(f); setVideoPreview(URL.createObjectURL(f)); } }} className="block text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer" />
				{videoPreview && <video src={videoPreview} controls className="w-full rounded-xl mt-1 max-h-40" />}
			</div>
			<div className="flex flex-col gap-1.5">
				<label className="input-label">Course Videos <span className="text-slate-400 font-normal">(multiple)</span></label>
				<input type="file" accept="video/*" multiple onChange={e => { const files = Array.from(e.target.files); setVideoFiles(p => [...p, ...files]); setVideoPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]); }} className="block text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer" />
				{videoPreviews.length > 0 && (
					<div className="grid grid-cols-2 gap-2 mt-1">
						{videoPreviews.map((p, i) => (
							<div key={i} className="relative">
								<video src={p} className="w-full h-24 object-cover rounded-lg" />
								<button type="button" onClick={() => { setVideoFiles(f => f.filter((_,j)=>j!==i)); setVideoPreviews(f => f.filter((_,j)=>j!==i)); }}
									className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white rounded-full text-xs flex items-center justify-center">×</button>
							</div>
						))}
					</div>
				)}
			</div>
			{error && <p className="text-rose-600 text-sm font-medium">{error}</p>}
			<button type="submit" disabled={uploading} className="btn-primary w-full mt-1">
				{uploading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{isEdit ? 'Updating…' : 'Adding…'}</> : (isEdit ? 'Update Course' : 'Add Course')}
			</button>
		</form>
	);

	return (
		<div className="min-h-screen bg-slate-50 lg:ml-16 pb-24 lg:pb-8">
			{/* Page Header */}
			<div className="bg-white border-b border-slate-200 px-5 sm:px-8 py-5">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-slate-900 tracking-tight">Courses</h1>
						<p className="text-slate-500 text-sm mt-0.5">Expand your knowledge for global education</p>
					</div>
					{isAdmin && (
						<button onClick={() => setShowAddModal(true)} className="btn-primary btn-sm flex items-center gap-1.5">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
							Add Course
						</button>
					)}
				</div>
			</div>

			<div className="px-5 sm:px-8 py-6">
				{loading ? (
					<div className="flex flex-col items-center justify-center py-24 gap-3">
						<div className="w-10 h-10 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin" />
						<p className="text-sm text-slate-500">Loading courses…</p>
					</div>
				) : courses.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-24 text-center">
						<div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
							<svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
						</div>
						<p className="text-slate-700 font-semibold mb-1">No courses yet</p>
						<p className="text-slate-400 text-sm">{isAdmin ? 'Add your first course to get started.' : 'Check back soon for new content.'}</p>
					</div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
						{courses.map((course) => (
							<div key={course.id}
								className="group bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-card-md transition-all duration-200 relative"
								onClick={() => setSelectedCourse(course)}>
								{/* Thumbnail */}
								<div className="relative w-full h-44 bg-gradient-to-br from-brand-600 to-violet-700 overflow-hidden">
									{course.image
										? <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
										: <div className="w-full h-full flex items-center justify-center">
											<span className="text-5xl font-black text-white/25 select-none">
												{course.title ? course.title.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : 'CO'}
											</span>
										</div>
									}
									<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
										<div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-card">
											<svg className="w-5 h-5 text-brand-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
										</div>
									</div>
									{course.price && (
										<span className="absolute top-3 right-3 bg-white/95 text-brand-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-xs">
											${course.price}
										</span>
									)}
								</div>
								{/* Body */}
								<div className="p-4">
									<h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{course.title}</h3>
									{course.description && <p className="text-xs text-slate-400 line-clamp-2 mt-1.5">{course.description}</p>}
									<div className="flex items-center gap-1.5 mt-3">
										<span className="badge badge-brand text-[10px]">Course</span>
										{course.videos?.length > 0 && <span className="badge badge-gray text-[10px]">{course.videos.length} videos</span>}
									</div>
								</div>
								{/* Admin kebab */}
								{isAdmin && (
									<div className="absolute top-3 left-3 z-10" onClick={e => e.stopPropagation()}>
										<button onClick={() => setMenuOpenId(menuOpenId === course.id ? null : course.id)}
											className="w-8 h-8 bg-white/90 hover:bg-white rounded-xl shadow-xs flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors">
											<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
												<circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
											</svg>
										</button>
										{menuOpenId === course.id && (
											<div className="absolute left-0 mt-1 w-28 bg-white rounded-xl shadow-card-md border border-slate-200 overflow-hidden z-20 animate-scale-in">
												<button className="block w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 font-medium"
													onClick={() => { setMenuOpenId(null); handleEditCourse(course); }}>Edit</button>
												<button className="block w-full text-left px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 font-medium"
													onClick={() => { setMenuOpenId(null); handleDeleteCourse(course.id); }}>Delete</button>
											</div>
										)}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{/* Course Detail Modal */}
			{selectedCourse && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedCourse(null)}>
					<div className="bg-white rounded-3xl shadow-card-xl w-full max-w-2xl flex flex-col animate-scale-in overflow-hidden" style={{ maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
						{/* Media */}
						<div className="relative w-full bg-gradient-to-br from-brand-700 to-violet-800" style={{ maxHeight: '50vh' }}>
							{selectedCourse.video
								? <video src={selectedCourse.video} controls autoPlay className="w-full" style={{ maxHeight: '50vh', background: '#000' }} />
								: selectedCourse.image
									? <img src={selectedCourse.image} alt={selectedCourse.title} className="w-full object-cover" style={{ maxHeight: '50vh' }} />
									: <div className="w-full h-56 flex items-center justify-center">
										<span className="text-7xl font-black text-white/20 select-none">
											{selectedCourse.title?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
										</span>
									</div>
							}
							<button onClick={() => setSelectedCourse(null)}
								className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-xl flex items-center justify-center transition-colors">
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
							</button>
						</div>
						{/* Content */}
						<div className="flex-1 overflow-y-auto p-6 sm:p-8">
							<div className="flex items-start justify-between gap-4 mb-3">
								<h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{selectedCourse.title}</h2>
								{selectedCourse.price && (
									<span className="flex-shrink-0 text-xl font-bold text-brand-600">${selectedCourse.price}</span>
								)}
							</div>
							{selectedCourse.description && (
								<p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{selectedCourse.description}</p>
							)}
							{selectedCourse.videos?.length > 0 && (
								<div className="mt-6">
									<h3 className="text-sm font-bold text-slate-900 mb-3">Course Videos</h3>
									<div className="space-y-3">
										{selectedCourse.videos.map((url, i) => (
											<video key={i} src={url} controls className="w-full rounded-xl border border-slate-100" />
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Add Course Modal */}
			{showAddModal && (
				<ModalShell title="Add New Course" onClose={() => setShowAddModal(false)}>
					<CourseForm data={newCourse} onChange={setNewCourse} onSubmit={handleAddCourse} isEdit={false} />
				</ModalShell>
			)}

			{/* Edit Course Modal */}
			{editCourse && (
				<ModalShell title="Edit Course" onClose={() => setEditCourse(null)}>
					<CourseForm data={editCourse} onChange={setEditCourse} onSubmit={handleUpdateCourse} isEdit={true} />
				</ModalShell>
			)}
		</div>
	);
};

export default Courses;
