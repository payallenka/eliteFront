import React, { useState, useEffect } from "react";
import { MdEvent, MdWork, MdOndemandVideo, MdAssignment, MdEdit, MdDelete, MdClose, MdAdd, MdMenuBook } from "react-icons/md";

// Determine backend URL - use localhost for development, Vercel for production
const BACKEND_URL = 'https://elite-scholars-eight.vercel.app';

export default function ControlPanel() {
  const [activeTab, setActiveTab] = useState('events');

  const tabs = [
    { id: 'events', label: 'Events', icon: MdEvent },
    { id: 'careers', label: 'Careers', icon: MdWork },
    { id: 'podcasts', label: 'Podcasts', icon: MdOndemandVideo },
    { id: 'blogs', label: 'Blogs', icon: MdMenuBook },
    { id: 'applications', label: 'Applications', icon: MdAssignment },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'events':
        return <EventsManager />;
      case 'careers':
        return <CareersManager />;
      case 'podcasts':
        return <PodcastsManager />;
      case 'blogs':
        return <BlogsManager />;
      case 'applications':
        return <ApplicationsManager />;
      default:
        return <EventsManager />;
    }
  };
// Blogs Manager Component with Full CRUD
function BlogsManager() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    cover_image: '',
    author: '',
    published_at: '',
    is_published: false,
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${BACKEND_URL}/api/admin/blogs`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch blogs: ${response.status} ${response.statusText}. ${errorText}`);
      }
      const data = await response.json();
      setBlogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch blogs.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      short_description: '',
      cover_image: '',
      author: '',
      published_at: '',
      is_published: false,
    });
    setShowForm(true);
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || '',
      slug: blog.slug || '',
      description: blog.description || '',
      short_description: blog.short_description || '',
      cover_image: blog.cover_image || '',
      author: blog.author || '',
      published_at: blog.published_at ? new Date(blog.published_at).toISOString().slice(0, 16) : '',
      is_published: blog.is_published || false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = `${BACKEND_URL}/api/admin/blogs`;
      const method = editingBlog ? 'PUT' : 'POST';
      const payload = editingBlog ? { id: editingBlog.id, ...formData } : formData;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save blog');
      }
      setShowForm(false);
      fetchBlogs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/admin/blogs`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error('Failed to delete blog');
      fetchBlogs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6c47ff] mx-auto mb-4"></div>
        <p>Loading blogs...</p>
      </div>
    );
  }

  if (error && blogs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-red-800 font-bold mb-2">Error Loading Blogs</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchBlogs}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Blogs Management</h2>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#6c47ff] text-white rounded-[50px] hover:bg-[#5a3ae8] transition-colors"
        >
          <MdAdd className="w-5 h-5" />
          New Blog
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {blogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No blogs found</td>
              </tr>
            ) : (
              blogs.map((blog) => (
                <tr key={blog.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{blog.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{blog.author}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blog.published_at ? new Date(blog.published_at).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${blog.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {blog.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleEdit(blog)}
                        className="text-[#6c47ff] hover:text-[#5a3ae8] flex items-center gap-1"
                      >
                        <MdEdit className="w-4 h-4" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(blog.id)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <MdDelete className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Blog Form Modal */}
      {showForm && (
        <BlogFormModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          isEditing={!!editingBlog}
          loading={loading}
        />
      )}
    </div>
  );
}

// Blog Form Modal Component
function BlogFormModal({ formData, setFormData, onSubmit, onClose, isEditing, loading }) {
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">{isEditing ? 'Edit Blog' : 'Create New Blog'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <MdClose className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
            <input
              type="text"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Published At</label>
              <input
                type="datetime-local"
                value={formData.published_at}
                onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  setFormData((prev) => ({ ...prev, cover_image: 'Uploading...' }));
                  try {
                    const { supabase } = await import('../supabaseClient');
                    const fileExt = file.name.split('.').pop();
                    const fileName = `blog_${Date.now()}.${fileExt}`;
                    const { data, error } = await supabase.storage
                      .from('blog-images')
                      .upload(fileName, file, { upsert: true });
                    if (error) throw error;
                    const { data: publicUrlData } = supabase.storage
                      .from('blog-images')
                      .getPublicUrl(fileName);
                    setFormData((prev) => ({ ...prev, cover_image: publicUrlData.publicUrl }));
                  } catch (err) {
                    setFormData((prev) => ({ ...prev, cover_image: '' }));
                    alert('Image upload failed: ' + (err.message || err));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Or paste image URL here"
                value={formData.cover_image && formData.cover_image !== 'Uploading...' ? formData.cover_image : ''}
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
                disabled={formData.cover_image === 'Uploading...'}
              />
            </div>
            {formData.cover_image && formData.cover_image !== 'Uploading...' && (
              <img src={formData.cover_image} alt="Cover Preview" className="mt-2 max-h-32 rounded" />
            )}
            {formData.cover_image === 'Uploading...' && (
              <div className="mt-2 text-sm text-gray-500">Uploading...</div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="form-checkbox h-4 w-4 text-[#6c47ff]"
              />
              <span className="text-sm text-gray-700">Published</span>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="ml-auto px-6 py-2 bg-[#6c47ff] text-white rounded-[50px] hover:bg-[#5a3ae8] transition-colors font-semibold"
            >
              {isEditing ? 'Update Blog' : 'Create Blog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-white text-[#1a0841] font-sans px-0 sm:px-4 py-8 ml-0 sm:ml-14 lg:ml-16" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>Control Panel</h1>
          <p className="text-base text-gray-600">Manage Events, Careers, Podcasts, and Applications</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex flex-nowrap overflow-x-auto w-full space-x-4 sm:space-x-8 pb-0" aria-label="Tabs" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0
                    ${activeTab === tab.id
                      ? 'border-[#6c47ff] text-[#6c47ff]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                  style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

// Events Manager Component with Full CRUD
function EventsManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    event_date: '',
    end_date: '',
    location: '',
    venue: '',
    mode: 'in-person',
    category: 'workshop',
    capacity: 100,
    cover_image: '',
    registration_url: '',
    is_featured: false,
    is_published: false,
    metadata: { speakers: [], universities: [] }
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ControlPanel] Fetching events from:', `${BACKEND_URL}/api/admin/events`);
      
      const response = await fetch(`${BACKEND_URL}/api/admin/events`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('[ControlPanel] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ControlPanel] API error response:', errorText);
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}. ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[ControlPanel] Received events:', data?.length || 0);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch events. Please check if the backend server is running.';
      setError(errorMsg);
      console.error('[ControlPanel] Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      short_description: '',
      event_date: '',
      end_date: '',
      location: '',
      venue: '',
      mode: 'in-person',
      category: 'workshop',
      capacity: 100,
      cover_image: '',
      registration_url: '',
      is_featured: false,
      is_published: false,
      metadata: { speakers: [], universities: [] }
    });
    setShowForm(true);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      slug: event.slug || '',
      description: event.description || '',
      short_description: event.short_description || '',
      event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
      end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
      location: event.location || '',
      venue: event.venue || '',
      mode: event.mode || 'in-person',
      category: event.category || 'workshop',
      capacity: event.capacity || 100,
      cover_image: event.cover_image || '',
      registration_url: event.registration_url || '',
      is_featured: event.is_featured || false,
      is_published: event.is_published || false,
      metadata: event.metadata || { speakers: [], universities: [] }
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = editingEvent 
        ? `${BACKEND_URL}/api/admin/events`
        : `${BACKEND_URL}/api/admin/events`;
      
      const method = editingEvent ? 'PUT' : 'POST';
      const payload = editingEvent 
        ? { id: editingEvent.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save event');
      }

      setShowForm(false);
      fetchEvents();
    } catch (err) {
      setError(err.message);
      console.error('Error saving event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/admin/events`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to delete event');
      fetchEvents();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting event:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6c47ff] mx-auto mb-4"></div>
        <p>Loading events...</p>
      </div>
    );
  }
  
  if (error && events.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-red-800 font-bold mb-2">Error Loading Events</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="text-sm text-red-600 space-y-1">
            <p>• Check if the backend server is running at: <code className="bg-red-100 px-2 py-1 rounded">{BACKEND_URL}</code></p>
            <p>• Verify your .env file has <code className="bg-red-100 px-2 py-1 rounded">VITE_BACKEND_URL</code> set correctly</p>
            <p>• Check the browser console for more details</p>
          </div>
          <button
            onClick={fetchEvents}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Events Management</h2>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#6c47ff] text-white rounded-[50px] hover:bg-[#5a3ae8] transition-colors"
        >
          <MdAdd className="w-5 h-5" />
          New Event
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No events found</td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{event.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.event_date ? new Date(event.event_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{event.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{event.mode || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${event.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {event.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleEdit(event)}
                        className="text-[#6c47ff] hover:text-[#5a3ae8] flex items-center gap-1"
                      >
                        <MdEdit className="w-4 h-4" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(event.id)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <MdDelete className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <EventFormModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          isEditing={!!editingEvent}
          loading={loading}
        />
      )}
    </div>
  );
}

// Event Form Modal Component
function EventFormModal({ formData, setFormData, onSubmit, onClose, isEditing, loading }) {
    // Speaker input state
    const [speakerInput, setSpeakerInput] = React.useState("");

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">{isEditing ? 'Edit Event' : 'Create New Event'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <MdClose className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Speakers Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Speakers</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add speaker name"
                value={speakerInput}
                onChange={e => setSpeakerInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
              <button
                type="button"
                className="px-4 py-2 bg-[#6c47ff] text-white rounded-[8px] hover:bg-[#5a3ae8]"
                onClick={() => {
                  if (speakerInput.trim()) {
                    setFormData(prev => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        speakers: [...(prev.metadata?.speakers || []), speakerInput.trim()]
                      }
                    }));
                    setSpeakerInput("");
                  }
                }}
              >Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(formData.metadata?.speakers || []).map((sp, idx) => (
                <span key={idx} className="inline-flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm font-medium text-gray-700">
                  {sp}
                  <button
                    type="button"
                    className="ml-2 text-red-500 hover:text-red-700"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        metadata: {
                          ...prev.metadata,
                          speakers: prev.metadata.speakers.filter((_, i) => i !== idx)
                        }
                      }));
                    }}
                  >×</button>
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Auto-generated if empty"
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
            <input
              type="text"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
              <input
                type="datetime-local"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              >
                <option value="online">Online</option>
                <option value="in-person">In-Person</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              >
                <option value="conference">Conference</option>
                <option value="workshop">Workshop</option>
                <option value="webinar">Webinar</option>
                <option value="fair">Fair</option>
                <option value="seminar">Seminar</option>
                <option value="networking">Networking</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  setFormData((prev) => ({ ...prev, cover_image: 'Uploading...' }));
                  try {
                    const { supabase } = await import('../supabaseClient');
                    const fileExt = file.name.split('.').pop();
                    const fileName = `event_${Date.now()}.${fileExt}`;
                    const { data, error } = await supabase.storage
                      .from('event-images')
                      .upload(fileName, file, { upsert: true });
                    if (error) throw error;
                    const { data: publicUrlData } = supabase.storage
                      .from('event-images')
                      .getPublicUrl(fileName);
                    setFormData((prev) => ({ ...prev, cover_image: publicUrlData.publicUrl }));
                  } catch (err) {
                    setFormData((prev) => ({ ...prev, cover_image: '' }));
                    alert('Image upload failed: ' + (err.message || err));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
              <input
                type="url"
                placeholder="Or paste image URL here"
                value={formData.cover_image && formData.cover_image !== 'Uploading...' ? formData.cover_image : ''}
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
                disabled={formData.cover_image === 'Uploading...'}
              />
            </div>
            {formData.cover_image && formData.cover_image !== 'Uploading...' && (
              <img src={formData.cover_image} alt="Cover Preview" className="mt-2 max-h-32 rounded" />
            )}
            {formData.cover_image === 'Uploading...' && (
              <div className="mt-2 text-sm text-gray-500">Uploading...</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration URL</label>
            <input
              type="url"
              value={formData.registration_url}
              onChange={(e) => setFormData({ ...formData, registration_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded border-gray-300 text-[#6c47ff] focus:ring-[#6c47ff]"
              />
              <span className="text-sm font-medium text-gray-700">Featured</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="rounded border-gray-300 text-[#6c47ff] focus:ring-[#6c47ff]"
              />
              <span className="text-sm font-medium text-gray-700">Published</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-[8px] hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#6c47ff] text-white rounded-[8px] hover:bg-[#5a3ae8] disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Careers Manager Component with Full CRUD
function CareersManager() {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCareer, setEditingCareer] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    department: '',
    location: '',
    job_type: 'full-time',
    experience_level: 'mid',
    salary_range: '',
    description: '',
    responsibilities: [],
    requirements: [],
    benefits: [],
    closing_date: '',
    is_featured: false,
    is_published: false
  });

  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ControlPanel] Fetching careers from:', `${BACKEND_URL}/api/admin/careers`);
      
      const response = await fetch(`${BACKEND_URL}/api/admin/careers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('[ControlPanel] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ControlPanel] API error response:', errorText);
        throw new Error(`Failed to fetch careers: ${response.status} ${response.statusText}. ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[ControlPanel] Received careers:', data?.length || 0);
      setCareers(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch careers. Please check if the backend server is running.';
      setError(errorMsg);
      console.error('[ControlPanel] Error fetching careers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCareer(null);
    setFormData({
      title: '',
      slug: '',
      department: '',
      location: '',
      job_type: 'full-time',
      experience_level: 'mid',
      salary_range: '',
      description: '',
      responsibilities: [],
      requirements: [],
      benefits: [],
      closing_date: '',
      is_featured: false,
      is_published: false
    });
    setShowForm(true);
  };

  const handleEdit = (career) => {
    setEditingCareer(career);
    setFormData({
      title: career.title || '',
      slug: career.slug || '',
      department: career.department || '',
      location: career.location || '',
      job_type: career.job_type || 'full-time',
      experience_level: career.experience_level || 'mid',
      salary_range: career.salary_range || '',
      description: career.description || '',
      responsibilities: Array.isArray(career.responsibilities) ? career.responsibilities : [],
      requirements: Array.isArray(career.requirements) ? career.requirements : [],
      benefits: Array.isArray(career.benefits) ? career.benefits : [],
      closing_date: career.closing_date ? new Date(career.closing_date).toISOString().slice(0, 10) : '',
      is_featured: career.is_featured || false,
      is_published: career.is_published || false
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = `${BACKEND_URL}/api/admin/careers`;
      const method = editingCareer ? 'PUT' : 'POST';
      const payload = editingCareer 
        ? { id: editingCareer.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save career');
      }

      setShowForm(false);
      fetchCareers();
    } catch (err) {
      setError(err.message);
      console.error('Error saving career:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/admin/careers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to delete career');
      fetchCareers();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting career:', err);
    } finally {
      setLoading(false);
    }
  };

  const addArrayItem = (field) => {
    const newItem = prompt(`Enter new ${field} item:`);
    if (newItem && newItem.trim()) {
      setFormData({
        ...formData,
        [field]: [...formData[field], newItem.trim()]
      });
    }
  };

  const removeArrayItem = (field, index) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index)
    });
  };

  if (loading && careers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6c47ff] mx-auto mb-4"></div>
        <p>Loading careers...</p>
      </div>
    );
  }
  
  if (error && careers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-red-800 font-bold mb-2">Error Loading Careers</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="text-sm text-red-600 space-y-1">
            <p>• Check if the backend server is running at: <code className="bg-red-100 px-2 py-1 rounded">{BACKEND_URL}</code></p>
            <p>• Verify your .env file has <code className="bg-red-100 px-2 py-1 rounded">VITE_BACKEND_URL</code> set correctly</p>
            <p>• Check the browser console for more details</p>
          </div>
          <button
            onClick={fetchCareers}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Careers Management</h2>
          <button 
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#6c47ff] text-white rounded-[50px] hover:bg-[#5a3ae8] transition-colors"
        >
          <MdAdd className="w-5 h-5" />
          New Job Posting
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {careers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No job postings found</td>
              </tr>
            ) : (
              careers.map((career) => (
                <tr key={career.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{career.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{career.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{career.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{career.job_type?.replace('-', ' ') || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${career.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {career.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleEdit(career)}
                        className="text-[#6c47ff] hover:text-[#5a3ae8] flex items-center gap-1"
                      >
                        <MdEdit className="w-4 h-4" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(career.id)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <MdDelete className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Career Form Modal */}
      {showForm && (
        <CareerFormModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          isEditing={!!editingCareer}
          loading={loading}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      )}
    </div>
  );
}

// Career Form Modal Component
function CareerFormModal({ formData, setFormData, onSubmit, onClose, isEditing, loading, addArrayItem, removeArrayItem }) {
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">{isEditing ? 'Edit Job Posting' : 'Create New Job Posting'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <MdClose className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
              <select
                value={formData.job_type}
                onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              >
                <option value="full-time">Full-Time</option>
                <option value="part-time">Part-Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
              <select
                value={formData.experience_level}
                onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              >
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
            <input
              type="text"
              value={formData.salary_range}
              onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
              placeholder="e.g., £30,000 - £40,000"
              className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
            />
          </div>

          {/* Responsibilities */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Responsibilities</label>
              <button type="button" onClick={() => addArrayItem('responsibilities')} className="text-sm text-[#6c47ff] hover:text-[#5a3ae8]">
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {formData.responsibilities.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...formData.responsibilities];
                      newItems[index] = e.target.value;
                      setFormData({ ...formData, responsibilities: newItems });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('responsibilities', index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <MdDelete className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Requirements</label>
              <button type="button" onClick={() => addArrayItem('requirements')} className="text-sm text-[#6c47ff] hover:text-[#5a3ae8]">
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {formData.requirements.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...formData.requirements];
                      newItems[index] = e.target.value;
                      setFormData({ ...formData, requirements: newItems });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('requirements', index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <MdDelete className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Benefits</label>
              <button type="button" onClick={() => addArrayItem('benefits')} className="text-sm text-[#6c47ff] hover:text-[#5a3ae8]">
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {formData.benefits.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...formData.benefits];
                      newItems[index] = e.target.value;
                      setFormData({ ...formData, benefits: newItems });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem('benefits', index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <MdDelete className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Closing Date</label>
            <input
              type="date"
              value={formData.closing_date}
              onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded border-gray-300 text-[#6c47ff] focus:ring-[#6c47ff]"
              />
              <span className="text-sm font-medium text-gray-700">Featured</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="rounded border-gray-300 text-[#6c47ff] focus:ring-[#6c47ff]"
              />
              <span className="text-sm font-medium text-gray-700">Published</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-[8px] hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#6c47ff] text-white rounded-[8px] hover:bg-[#5a3ae8] disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Job Posting' : 'Create Job Posting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Podcasts Manager Component with Full CRUD
function PodcastsManager() {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    youtube_url: '',
    cover_image: '',
    duration_minutes: 30,
    episode_number: 1,
    publish_date: '',
    transcript: '',
    guest_name: '',
    guest_title: '',
    is_published: false
  });

  useEffect(() => {
    fetchPodcasts();
  }, []);

  const fetchPodcasts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${BACKEND_URL}/api/admin/podcasts`);
      if (!response.ok) throw new Error('Failed to fetch podcasts');
      const data = await response.json();
      setPodcasts(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching podcasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPodcast(null);
    setFormData({
      title: '',
      slug: '',
      description: '',
      youtube_url: '',
      cover_image: '',
      duration_minutes: 30,
      episode_number: 1,
      publish_date: '',
      transcript: '',
      guest_name: '',
      guest_title: '',
      is_published: false
    });
    setShowForm(true);
  };

  const handleEdit = (podcast) => {
    setEditingPodcast(podcast);
    setFormData({
      title: podcast.title || '',
      slug: podcast.slug || '',
      description: podcast.description || '',
      youtube_url: podcast.youtube_url || '',
      cover_image: podcast.cover_image || '',
      duration_minutes: podcast.duration_minutes || 30,
      episode_number: podcast.episode_number || 1,
      publish_date: podcast.publish_date ? new Date(podcast.publish_date).toISOString().slice(0, 10) : '',
      transcript: podcast.transcript || '',
      guest_name: podcast.guest_name || '',
      guest_title: podcast.guest_title || '',
      is_published: podcast.is_published || false
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = `${BACKEND_URL}/api/admin/podcasts`;
      const method = editingPodcast ? 'PUT' : 'POST';
      const payload = editingPodcast 
        ? { id: editingPodcast.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save podcast');
      }

      setShowForm(false);
      fetchPodcasts();
    } catch (err) {
      setError(err.message);
      console.error('Error saving podcast:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this podcast episode?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/admin/podcasts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to delete podcast');
      fetchPodcasts();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting podcast:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && podcasts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6c47ff] mx-auto mb-4"></div>
        <p>Loading podcasts...</p>
      </div>
    );
  }
  
  if (error && podcasts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-red-800 font-bold mb-2">Error Loading Podcasts</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchPodcasts}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Podcasts Management</h2>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#6c47ff] text-white rounded-[50px] hover:bg-[#5a3ae8] transition-colors"
        >
          <MdAdd className="w-5 h-5" />
          New Podcast
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Episode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {podcasts.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No podcasts found</td>
              </tr>
            ) : (
              podcasts.map((podcast) => (
                <tr key={podcast.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">EP {podcast.episode_number || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{podcast.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{podcast.guest_name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${podcast.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {podcast.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleEdit(podcast)}
                        className="text-[#6c47ff] hover:text-[#5a3ae8] flex items-center gap-1"
                      >
                        <MdEdit className="w-4 h-4" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(podcast.id)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <MdDelete className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Podcast Form Modal */}
      {showForm && (
        <PodcastFormModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          isEditing={!!editingPodcast}
          loading={loading}
        />
      )}
    </div>
  );
}

// Podcast Form Modal Component
function PodcastFormModal({ formData, setFormData, onSubmit, onClose, isEditing, loading }) {
  const generateSlug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">{isEditing ? 'Edit Podcast Episode' : 'Create New Podcast Episode'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <MdClose className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Episode Number *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.episode_number}
                onChange={(e) => setFormData({ ...formData, episode_number: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="Auto-generated if empty"
              className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL *</label>
            <input
              type="url"
              required
              value={formData.youtube_url}
              onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
              <input
                type="text"
                value={formData.guest_name}
                onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guest Title/Role</label>
              <input
                type="text"
                value={formData.guest_title}
                onChange={(e) => setFormData({ ...formData, guest_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="0"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
              <input
                type="date"
                value={formData.publish_date}
                onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
            <input
              type="url"
              value={formData.cover_image}
              onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transcript</label>
            <textarea
              value={formData.transcript}
              onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
              rows="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
              placeholder="Full transcript or summary..."
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="rounded border-gray-300 text-[#6c47ff] focus:ring-[#6c47ff]"
              />
              <span className="text-sm font-medium text-gray-700">Published</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-[8px] hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#6c47ff] text-white rounded-[8px] hover:bg-[#5a3ae8] disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Podcast' : 'Create Podcast'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Applications Manager Component
function ApplicationsManager() {
    // ...existing code...
    // Delete application handler
    const handleDelete = async (id) => {
      if (!window.confirm('Are you sure you want to delete this application?')) return;
      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/applications`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (!response.ok) throw new Error('Failed to delete application');
        fetchApplications();
        setSelectedApp(null);
      } catch (err) {
        setError(err.message);
        console.error('Error deleting application:', err);
      }
    };
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = filter !== 'all' ? `${BACKEND_URL}/api/admin/applications?type=${filter}` : `${BACKEND_URL}/api/admin/applications`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      setApplications(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (id, status) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/applications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      fetchApplications();
    } catch (err) {
      setError(err.message);
      console.error('Error updating application:', err);
    }
  };

  const updateAdminNotes = async (id, admin_notes) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/applications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, admin_notes }),
      });
      if (!response.ok) throw new Error('Failed to update notes');
      fetchApplications();
    } catch (err) {
      setError(err.message);
      console.error('Error updating notes:', err);
    }
  };

  // Helper function to get color classes based on application type
  const getApplicationTypeColor = (type) => {
    switch (type) {
      case 'event_registration':
        return 'bg-[#D72E2D] text-white'; // Red background with white text
      case 'job_application':
        return 'bg-[#6c47ff] text-white'; // Purple background with white text
      case 'general_application':
        return 'bg-[#0B0E32] text-white'; // Dark blue background with white text
      default:
        return 'bg-[#6c47ff] text-white';
    }
  };

  if (loading && applications.length === 0) return <div className="text-center py-8">Loading applications...</div>;
  if (error && applications.length === 0) return <div className="text-red-600 py-8">Error: {error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Applications Management</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="job_application">Job Applications</option>
          <option value="event_registration">Event Registrations</option>
          <option value="general_application">General Applications</option>
        </select>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position/Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No applications found</td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getApplicationTypeColor(app.type)}`}>
                      {app.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{app.position_title || app.event_title || app.desired_role || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={app.status || 'submitted'}
                      onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-[8px] px-2 py-1 focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Rejected</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="attended">Attended</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedApp(app)}
                        className="text-[#6c47ff] hover:text-[#5a3ae8]"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                        title="Delete Application"
                      >
                        <MdDelete className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdateNotes={updateAdminNotes}
        />
      )}
    </div>
  );
}

// Application Detail Modal
function ApplicationDetailModal({ application, onClose, onUpdateNotes }) {
  const [notes, setNotes] = useState(application.admin_notes || '');
  const [saving, setSaving] = useState(false);

  const handleSaveNotes = async () => {
    setSaving(true);
    await onUpdateNotes(application.id, notes);
    setSaving(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">Application Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <MdClose className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <p className="text-sm text-gray-900">{application.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-sm text-gray-900">{application.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <p className="text-sm text-gray-900">{application.phone || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <p className="text-sm text-gray-900">{application.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <p className="text-sm text-gray-900 capitalize">{application.status}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
              <p className="text-sm text-gray-900">
                {application.created_at ? new Date(application.created_at).toLocaleString() : '-'}
              </p>
            </div>
          </div>

          {application.position_title && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <p className="text-sm text-gray-900">{application.position_title}</p>
            </div>
          )}

          {application.event_title && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
              <p className="text-sm text-gray-900">{application.event_title}</p>
            </div>
          )}

          {application.linkedin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
              <a href={application.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-[#6c47ff] hover:underline">
                {application.linkedin}
              </a>
            </div>
          )}

          {application.cover_letter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{application.cover_letter}</p>
            </div>
          )}

          {application.resume_url && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
              <a href={application.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#6c47ff] hover:underline">
                Download Resume
              </a>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:ring-2 focus:ring-[#6c47ff] focus:border-transparent"
            />
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="mt-2 px-4 py-2 bg-[#6c47ff] text-white rounded-[8px] hover:bg-[#5a3ae8] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>

          <div className="flex justify-between pt-4 border-t gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-[8px] hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this application?')) {
                  // Pass delete up to ApplicationsManager
                  if (typeof window.handleDeleteApplication === 'function') {
                    window.handleDeleteApplication(application.id);
                  }
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-[8px] hover:bg-red-700"
            >
              Delete Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
