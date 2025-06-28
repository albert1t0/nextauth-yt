import React from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

const cards = [
  {
    title: 'Carga archivos',
    description: 'Sube tus archivos de datos de manera sencilla y segura para comenzar el análisis.'
  },
  {
    title: 'Ingresa tus datos',
    description: 'Completa la información necesaria para personalizar tu experiencia en la plataforma.'
  },
  {
    title: 'Revisa la documentación',
    description: 'Consulta la documentación para aprovechar al máximo todas las funcionalidades.'
  }
];

const HomePage = () => {
  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center min-h-[60vh] px-6 md:px-12">
        <h1 className="text-4xl font-bold text-center my-8">Bienvenido a la Plataforma de Análisis</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mb-8">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-md border p-6 flex flex-col items-center text-center transition hover:shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
              <p className="text-gray-600">{card.description}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default HomePage