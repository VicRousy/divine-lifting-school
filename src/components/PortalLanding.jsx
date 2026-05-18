function PortalLanding({ onSelectPortal }) {
  const portals = [
    {
      id: 'admin',
      title: 'Administrator',
      subtitle: 'Full school management, staff, students, and academics',
      icon: '🏛️',
      color: '#38bdf8',
      borderColor: '#38bdf844'
    },
    {
      id: 'teacher',
      title: 'Teacher',
      subtitle: 'Gradebook, attendance, class rosters, and announcements',
      icon: '👩‍🏫',
      color: '#a855f7',
      borderColor: '#a855f744'
    },
    {
      id: 'student',
      title: 'Student',
      subtitle: 'View grades, attendance, timetable, and school announcements',
      icon: '🎓',
      color: '#10b981',
      borderColor: '#10b98144'
    },
    {
      id: 'parent',
      title: 'Parent',
      subtitle: 'Track your child progress, attendance, and school updates',
      icon: '👨‍👩‍👧',
      color: '#f59e0b',
      borderColor: '#f59e0b44'
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{
          fontSize: '2.5rem',
          margin: 0,
          background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          DIVINE LIFTING SCHOOL
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '10px' }}>
          Academic Management System
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        maxWidth: '900px',
        width: '100%'
      }}>
        {portals.map((portal) => (
          <div
            key={portal.id}
            onClick={() => onSelectPortal(portal.id)}
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: `1px solid ${portal.borderColor}`,
              borderRadius: '16px',
              padding: '35px 30px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)'
              e.currentTarget.style.borderColor = portal.color
              e.currentTarget.style.boxShadow = `0 20px 40px -10px ${portal.color}30`
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = portal.borderColor
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>{portal.icon}</div>
            <h3 style={{
              margin: '0 0 10px 0',
              color: portal.color,
              fontSize: '1.3rem'
            }}>
              {portal.title} Portal
            </h3>
            <p style={{
              margin: 0,
              color: '#94a3b8',
              fontSize: '0.9rem',
              lineHeight: '1.5'
            }}>
              {portal.subtitle}
            </p>
          </div>
        ))}
      </div>

      <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: '60px' }}>
        Select your portal to continue
      </p>
    </div>
  )
}

export default PortalLanding
