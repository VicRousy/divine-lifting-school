import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { Upload, Send, Image as ImageIcon } from 'lucide-react'

export default function PostNews({ showToast }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    excerpt: '',
    published_date: new Date().toISOString().split('T')[0],
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let imageUrl = ''

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('news_images')
          .upload(fileName, imageFile)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('news_images')
          .getPublicUrl(fileName)
        
        imageUrl = urlData.publicUrl
      }

      const { error: insertError } = await supabase
        .from('public_news')
        .insert([{
          ...formData,
          image_url: imageUrl,
          created_at: new Date().toISOString()
        }])

      if (insertError) throw insertError

      showToast('News published successfully!', 'success')
      setFormData({
        title: '',
        category: 'General',
        excerpt: '',
        published_date: new Date().toISOString().split('T')[0],
      })
      setImageFile(null)
      setImagePreview(null)
    } catch (err) {
      showToast('Failed to post news: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '10px',
    color: '#f8fafc',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '24px',
        border: '1px solid #334155',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{
            padding: '12px',
            background: 'rgba(56, 189, 248, 0.1)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Send size={24} color="#38bdf8" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#f8fafc' }}>Post New Update</h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>Publish news to the public website</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} style={{
        background: '#1e293b',
        borderRadius: '20px',
        padding: '32px',
        border: '1px solid #334155',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Title */}
          <div>
            <label style={labelStyle}>News Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. Upcoming Graduation Ceremony"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
              onBlur={(e) => e.target.style.borderColor = '#334155'}
            />
          </div>

          {/* Category & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
              >
                <option value="General">General</option>
                <option value="Academics">Academics</option>
                <option value="Events">Events</option>
                <option value="Sports">Sports</option>
                <option value="Admissions">Admissions</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Published Date</label>
              <input
                type="date"
                name="published_date"
                value={formData.published_date}
                onChange={handleChange}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
                onBlur={(e) => e.target.style.borderColor = '#334155'}
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label style={labelStyle}>Short Description</label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Brief summary of the news..."
              style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
              onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
              onBlur={(e) => e.target.style.borderColor = '#334155'}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label style={labelStyle}>Cover Image</label>
            <div style={{
              border: '2px dashed #334155',
              borderRadius: '16px',
              padding: '40px 20px',
              textAlign: 'center',
              backgroundColor: '#0f172a',
              cursor: 'pointer',
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#334155'}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
              {imagePreview ? (
                <div>
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '12px', marginBottom: '12px' }} />
                  <p style={{ color: '#38bdf8', fontWeight: '600', margin: 0 }}>{imageFile.name}</p>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0' }}>Click to change image</p>
                </div>
              ) : (
                <div>
                  <ImageIcon size={40} color="#475569" style={{ marginBottom: '12px' }} />
                  <p style={{ color: '#94a3b8', fontWeight: '600', margin: '0 0 8px' }}>Click or drag image here</p>
                  <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#475569' : 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
              color: loading ? '#94a3b8' : '#0f172a',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 20px rgba(56, 189, 248, 0.3)',
              marginTop: '8px'
            }}
          >
            {loading ? 'Publishing...' : 'Publish News'}
          </button>
        </div>
      </form>
    </div>
  )
}
