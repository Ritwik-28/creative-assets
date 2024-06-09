import React, { useState, useEffect } from 'react';
import './App.css';

const baseURL = process.env.REACT_APP_DIRECTUS_URL;

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentOption, setCurrentOption] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [modalData, setModalData] = useState({ isOpen: false, imageSrc: '', imageName: '' });

  useEffect(() => {
    const fetchData = async () => {
      const token = await getAuthToken();
      if (token) {
        const result = await getData(token);
        setData(result);
        setFilteredData(result);
      }
    };
    fetchData();
  }, []);

  const getAuthToken = async () => {
    try {
      const response = await fetch('/api/get-token');
      const data = await response.json();
      if (response.ok) {
        return data.token;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error obtaining token:', error);
      return null;
    }
  };

  const getData = async (token) => {
    try {
      const response = await fetch(`/api/fetch-content?token=${token}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.map(item => ({
        imageName: item.asset_image,
        image: `${baseURL}/assets/${item.asset_image}`,
        contentName: item.asset_image,
        content: item.asset_message.replace(/\r\n/g, '<br>'),
        tags: item.transition_type,
        program: item.program_name,
      }));
    } catch (error) {
      console.error('Error fetching data from Directus:', error);
      return [];
    }
  };

  useEffect(() => {
    filterData();
  }, [currentOption, filterTag, data]);

  const filterData = () => {
    let filtered = data;
    if (currentOption !== 'all') {
      filtered = filtered.filter(item => item.program.includes(currentOption));
    }
    if (filterTag !== 'all') {
      filtered = filtered.filter(item => item.tags.includes(filterTag));
    }
    setFilteredData(filtered);
  };

  const handleOptionChange = (option) => {
    setCurrentOption(option);
    setFilterTag('all');
  };

  const handleFilterChange = (tag) => {
    setFilterTag(tag);
  };

  const showModal = (imageSrc, imageName) => {
    setModalData({ isOpen: true, imageSrc, imageName });
  };

  const closeModal = () => {
    setModalData({ isOpen: false, imageSrc: '', imageName: '' });
  };

  const handleCopyContent = (content, contentName) => {
    const el = document.createElement('div');
    el.innerHTML = content;
    el.contentEditable = 'true';
    document.body.appendChild(el);

    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    try {
      document.execCommand('copy');
      alert('Content copied');
    } catch (err) {
      console.error('Failed to copy', err);
    } finally {
      document.body.removeChild(el);
    }
  };

  return (
    <div className="App">
      <div id="options">
        <button id="all" onClick={() => handleOptionChange('all')} className={currentOption === 'all' ? 'active' : ''}>
          All Programs
        </button>
        <button id="FSD" onClick={() => handleOptionChange('FSD')} className={currentOption === 'FSD' ? 'active' : ''}>
          Fellowship Program in Software Development
        </button>
        <button id="QA" onClick={() => handleOptionChange('QA')} className={currentOption === 'QA' ? 'active' : ''}>
          Fellowship Program in QA Automation
        </button>
        <div id="filterContainer">
          <select id="tagFilter" value={filterTag} onChange={(e) => handleFilterChange(e.target.value)}>
            <option value="all">All Tags</option>
            {['Premium', 'Advanced', 'Engagement/DNP', 'Post Nurture Engagement', 'Pre Nurture Engagement', 'Educative', 'User Asked'].map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <button id="resetFilter" onClick={() => handleFilterChange('all')}>Reset</button>
        </div>
      </div>
      <div id="tableContainer">
        <table>
          <thead>
            <tr>
              <th><center>Creative Assets</center></th>
              <th><center>Message</center></th>
              <th><center>Use Case</center></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr key={index}>
                <td className="hover-container">
                  <img src={row.image} alt={row.imageName} onClick={() => showModal(row.image, row.imageName)} />
                  <span className="tooltip">Click to view</span>
                </td>
                <td className="copy-content" onClick={() => handleCopyContent(row.content, row.contentName)}>
                  <span className="content-text" data-content-name={row.contentName} dangerouslySetInnerHTML={{ __html: row.content }}></span>
                  <span className="tooltip">Click to copy</span>
                </td>
                <td>{row.tags.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalData.isOpen && (
        <div id="imageModal" className="modal open" onClick={closeModal}>
          <span id="closeModal" className="close" onClick={closeModal}>&times;</span>
          <a id="downloadLink" href={modalData.imageSrc} download={modalData.imageName}>
            <img className="modal-content" id="modalImage" src={modalData.imageSrc} alt={modalData.imageName} />
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
