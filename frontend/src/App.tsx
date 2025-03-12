import ContactPopup from './components/ContactPopup'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Välkommen
        </h1>
        {/* Annat innehåll kan läggas till här */}
      </div>
      <ContactPopup />
    </div>
  )
}

export default App
