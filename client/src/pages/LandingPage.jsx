import { motion, useScroll, useSpring } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FiMail,
  FiCalendar,
  FiFileText,
  FiDatabase,
  FiClock,
  FiLink,
  FiGrid,
  FiLayers
} from 'react-icons/fi'
import { RiRobot2Line } from 'react-icons/ri'

const DiagonalSection = ({ children, reverse }) => (
  <div className={`relative py-20 ${reverse ? 'bg-[#111]' : 'bg-gradient-to-br from-yellow-400 to-yellow-500'}`}>
    <div className="absolute inset-0 overflow-hidden backdrop-blur-3xl">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute h-[2px] ${reverse ? 'bg-yellow-400/20' : 'bg-black/5'}`}
          style={{
            width: Math.random() * 300 + 100,
            top: `${(i * 5) + Math.random() * 5}%`,
            left: `${Math.random() * 100}%`,
            filter: 'blur(1px)',
          }}
          animate={{
            x: [0, 100, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
    <div className="relative container mx-auto px-6">{children}</div>
  </div>
)

const FeatureStrip = ({ feature, index }) => (
  <motion.div
    initial={{ x: index % 2 === 0 ? -100 : 100, opacity: 0 }}
    whileInView={{ x: 0, opacity: 1 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className={`flex items-center gap-8 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} 
      py-12 border-b border-yellow-400/20`}
  >
    <div className="w-24 h-24 flex-shrink-0 rounded-full bg-yellow-400 flex items-center justify-center">
      <feature.icon className="w-12 h-12 text-black" />
    </div>
    <div>
      <h3 className="text-2xl font-bold mb-2 text-white">{feature.title}</h3>
      <p className="text-gray-300">{feature.description}</p>
    </div>
  </motion.div>
)

const StaggeredGrid = ({ items }) => (
  <div className="grid md:grid-cols-2 gap-8">
    {items.map((item, i) => (
      <motion.div
        key={i}
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        whileHover={{ y: -5, scale: 1.02 }}
        transition={{ delay: i * 0.1 }}
        className="bg-black/90 backdrop-blur-xl rounded-2xl p-8 border border-yellow-400/20
          hover:border-yellow-400 transition-all shadow-lg hover:shadow-yellow-400/20"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-yellow-400/10 rounded-xl">
            <item.icon className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-xl font-bold text-white">{item.title}</h3>
        </div>
        <p className="text-gray-300">{item.description}</p>
      </motion.div>
    ))}
  </div>
)

export default function LandingPage() {
  const navigate = useNavigate()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  const handleStartTrial = () => {
    navigate('/login')
  }

  const mainFeatures = [
    {
      icon: FiMail,
      title: "Smart Email Management",
      description: "Automatically fetch, categorize, and prioritize emails across all your accounts.",
      color: "border-purple-100"
    },
    {
      icon: FiCalendar,
      title: "Intelligent Meeting Scheduler",
      description: "AI-powered meeting scheduling that syncs with your calendar and adapts to your preferences.",
      color: "border-blue-100"
    },
    {
      icon: FiFileText,
      title: "Document Automation",
      description: "Automatically create and organize Google Docs and Sheets based on your templates.",
      color: "border-pink-100"
    },
    {
      icon: FiDatabase,
      title: "Notion Integration",
      description: "Seamless synchronization with Notion databases, pages, and workflows.",
      color: "border-indigo-100"
    }
  ]

  const workflowFeatures = [
    {
      icon: FiClock,
      title: "Time Management",
      description: "Smart scheduling system that optimizes your daily workflow and meeting times.",
      color: "border-green-100"
    },
    {
      icon: FiLink,
      title: "Cross-Platform Sync",
      description: "Unified integration between Gmail, Google Calendar, Docs, Sheets, and Notion.",
      color: "border-orange-100"
    },
    {
      icon: FiGrid,
      title: "Smart Templates",
      description: "Customizable templates for documents, spreadsheets, and Notion pages.",
      color: "border-teal-100"
    },
    {
      icon: FiLayers,
      title: "Workflow Automation",
      description: "Create automated workflows between email, calendar, documents, and Notion.",
      color: "border-cyan-100"
    }
  ]

  return (
    <div className="min-h-screen bg-[#111]">
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-yellow-400 z-50"
        style={{ scaleX }}
      />

      <section className="min-h-screen relative flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        </div>
        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-12"
            >
              <span className="inline-block px-6 py-2 bg-yellow-400/10 border border-yellow-400/20 
                rounded-full text-yellow-400 text-sm font-medium backdrop-blur-xl">
                Revolutionizing Workflow Automation
              </span>
            </motion.div>
            <h1 className="text-6xl md:text-8xl font-bold mb-8 text-white leading-tight">
              Work Smarter with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500">
                AI Integration
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-12">
              Seamlessly connect your emails, meetings, documents, and Notion workspace
            </p>
            <div className="flex items-center justify-center gap-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black 
                  font-bold rounded-xl shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/40 
                  transition-all"
                onClick={handleStartTrial}
              >
                Get Started Now
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-black/30 backdrop-blur-xl text-white font-bold rounded-xl 
                  border border-yellow-400/20 hover:border-yellow-400 transition-all"
              >
                Watch Demo
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <DiagonalSection reverse>
        <div className="space-y-4">
          {mainFeatures.map((feature, index) => (
            <FeatureStrip key={index} feature={feature} index={index} />
          ))}
        </div>
      </DiagonalSection>

      <DiagonalSection>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 text-black">Workflow Management</h2>
          <p className="text-xl text-black/70">Everything you need to manage your Marketing automation</p>
        </motion.div>
        <StaggeredGrid items={workflowFeatures} />
      </DiagonalSection>
    </div>
  )
}