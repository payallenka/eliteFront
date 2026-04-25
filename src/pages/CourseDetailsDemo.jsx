import React from 'react';

// Dummy data for demonstration
const dummyCourse = {
  title: 'Artificial Intelligence for Business + ChatGPT Prize [2025]',
  subtitle: 'Solve Real World Business Problems with AI Solutions implemented in Python. Code templates included.',
  instructors: ['Hadelin de Ponteves', 'Kirill Eremenko', 'SuperDataScience Team', 'Ligency'],
  lastUpdated: '09/2025',
  language: 'English',
  rating: 4.4,
  ratingsCount: 4866,
  students: 34373,
  price: '₹439',
  oldPrice: '₹3,559',
  discount: '88% off',
  hours: '15 hours on-demand video',
  articles: 18,
  certificate: true,
  requirements: ['High School Maths', 'Basic Python Knowledge'],
  whatYouWillLearn: [
    'OPTIMIZE BUSINESS PROCESSES',
    'Implement Q-Learning',
    'Build an Optimization Model',
    'Maximize Efficiency',
    'MINIMIZE COSTS',
    'Implement Deep Q-Learning',
    'Build an AI Environment from scratch',
    'Build an Artificial Brain',
    'Master the General AI Framework',
    'Save and Load a model',
    'Implement Early Stopping',
    'MAXIMIZE REVENUES',
    'Implement Thompson Sampling',
    'Leverage AI to make the best decision',
    'Implement Online Learning',
    'Implement Recent Analysis',
  ],
  description: `Structure of the course:\n\nPart 1 - Optimizing Business Processes\nCase Study: Optimizing the Flows in an E-Commerce Warehouse\nAI Solution: Q-Learning\n\nPart 2 - Minimizing Costs\nCase Study: Minimizing the Costs in Energy Consumption of a Data Center\nAI Solution: Deep Q-Learning\n\nPart 3 - Maximizing Revenues\nCase Study: Maximizing Revenue of an Online Retail Business`,
  image: 'https://img-c.udemycdn.com/course/480x270/4373988_46b8_2.jpg',
};

const CourseDetailsDemo = () => {
  return (
    <div className="min-h-screen bg-[#f6f6fa] text-[#1a0841] font-sans py-8 px-2 sm:px-4 md:px-6">
      <div className="w-full">
        <div className="flex flex-col md:flex-row gap-8 w-full">
          {/* Main Content */}
          <div className="flex-1 bg-white rounded-3xl shadow-xl border border-gray-200 p-6 md:p-8 mb-6 md:mb-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2" style={{ fontFamily: 'Montserrat, Inter, Hedvig Letters Sans, sans-serif', fontWeight: 400 }}>{dummyCourse.title}</h2>
            <div className="text-base sm:text-lg text-[#a3a3b3] mb-4">{dummyCourse.subtitle}</div>
            <div className="mb-2 text-base">
              Created by{' '}
              {dummyCourse.instructors.map((name, i) => (
                <span key={name} className="text-[#e60023] font-semibold">
                  {name}{i < dummyCourse.instructors.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
            <div className="text-sm text-[#a3a3b3] mb-4">
              Last updated {dummyCourse.lastUpdated} • {dummyCourse.language}
            </div>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xl font-bold">{dummyCourse.rating} ★</span>
              <span className="text-[#a3a3b3]">({dummyCourse.ratingsCount} ratings)</span>
              <span className="text-[#a3a3b3]">{dummyCourse.students} students</span>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">What you'll learn</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-base list-none p-0">
                {dummyCourse.whatYouWillLearn.map((item, i) => (
                  <li key={i} className="mb-1">✔ {item}</li>
                ))}
              </ul>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">Requirements</h3>
              <ul className="text-base list-disc pl-5">
                {dummyCourse.requirements.map((item, i) => (
                  <li key={i} className="mb-1">{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Description</h3>
              <pre className="text-base bg-transparent border-0 whitespace-pre-wrap font-sans">{dummyCourse.description}</pre>
            </div>
          </div>
          {/* Sidebar Card */}
          <div className="w-full md:w-96 flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 flex flex-col items-center">
              <img src={dummyCourse.image} alt="Course" className="w-full h-48 object-cover rounded-2xl mb-4" />
              <div className="text-2xl font-bold text-[#1a0841] mb-2">{dummyCourse.price} <span className="line-through text-[#a3a3b3] text-lg ml-2">{dummyCourse.oldPrice}</span></div>
              <div className="text-[#e60023] font-semibold mb-2">{dummyCourse.discount}</div>
              <button className="w-full bg-[#e60023] hover:bg-[#c2001a] text-white font-bold text-lg rounded-full py-3 mb-3 transition">Add to cart</button>
              <button className="w-full bg-white text-[#1a0841] border border-[#e60023] font-bold text-lg rounded-full py-3 mb-3 transition">Buy now</button>
              <div className="text-[#a3a3b3] text-sm mb-2">30-Day Money-Back Guarantee</div>
              <div className="text-[#1a0841] text-base mb-2">Full Lifetime Access</div>
              <div className="text-[#1a0841] text-base mb-2">{dummyCourse.hours}</div>
              <div className="text-[#1a0841] text-base mb-2">{dummyCourse.articles} articles</div>
              {dummyCourse.certificate && <div className="text-[#1a0841] text-base mb-2">Certificate of completion</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsDemo;
