import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import './App.css';

const baseURL = process.env.REACT_APP_DIRECTUS_URL;

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [tags, setTags] = useState([]);
  const [currentOption, setCurrentOption] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [modalData, setModalData] = useState({ isOpen: false, imageSrc: '', imageName: '' });
  const modalTooltipRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = await getAuthToken();
      if (token) {
        const result = await getData(token);
        setData(result);
        setFilteredData(result);
        setPrograms([...new Set(result.flatMap(item => item.program))]);
        setTags([...new Set(result.flatMap(item => item.tags))]);
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
        tags: Array.isArray(item.transition_type) ? item.transition_type : [],
        program: Array.isArray(item.program_name) ? item.program_name : [],
      }));
    } catch (error) {
      console.error('Error fetching data from Directus:', error);
      return [];
    }
  };

  const filterData = useCallback(() => {
    let filtered = data;
    if (currentOption !== 'all') {
      filtered = filtered.filter(item => item.program.includes(currentOption));
    }
    if (filterTag !== 'all') {
      filtered = filtered.filter(item => item.tags.includes(filterTag));
    }
    setFilteredData(filtered);
  }, [currentOption, filterTag, data]);

  useEffect(() => {
    filterData();
  }, [currentOption, filterTag, data, filterData]);

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

  const handleCopyContent = (e, content, contentName) => {
    e.preventDefault();
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
      const tooltip = e.currentTarget.querySelector('.tooltip');
      tooltip.innerText = 'Copied';
      setTimeout(() => {
        tooltip.innerText = 'Click to copy';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    } finally {
      document.body.removeChild(el);
    }
  };

  const downloadImage = (url) => {
    const link = document.createElement('a');
    link.href = `${url}?download=true`;
    link.download = url.substring(url.lastIndexOf('/') + 1);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadImage = (e, imageSrc, imageName) => {
    e.preventDefault();
    downloadImage(imageSrc);
  };

  const handleMouseMove = (e, container) => {
    const tooltip = container.querySelector('.tooltip');
    if (tooltip) {
      tooltip.style.left = `${e.clientX - container.getBoundingClientRect().left}px`;
      tooltip.style.top = `${e.clientY - container.getBoundingClientRect().top}px`;
    }
  };

  const handleMouseLeave = (container) => {
    const tooltip = container.querySelector('.tooltip');
    if (tooltip) {
      tooltip.style.left = '-9999px';
      tooltip.style.top = '-9999px';
    }
  };

  const handleModalMouseMove = (e) => {
    if (modalTooltipRef.current) {
      modalTooltipRef.current.style.left = `${e.clientX - e.currentTarget.getBoundingClientRect().left}px`;
      modalTooltipRef.current.style.top = `${e.clientY - e.currentTarget.getBoundingClientRect().top}px`;
    }
  };

  return (
    <div className="App">
      <div id="options-container">
        <div id="options">
          <button id="all" onClick={() => handleOptionChange('all')} className={currentOption === 'all' ? 'active' : ''}>
            All Programs
          </button>
          {programs.map(program => (
            <button
              key={program}
              onClick={() => handleOptionChange(program)}
              className={currentOption === program ? 'active' : ''}
            >
              {program}
            </button>
          ))}
        </div>
        <div id="filterContainer">
          <select id="tagFilter" value={filterTag} onChange={(e) => handleFilterChange(e.target.value)}>
            <option value="all">All Tags</option>
            {tags.map(tag => (
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
                <td
                  className="hover-container"
                  onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
                  onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}
                >
                  <LazyLoadImage
                    effect="blur"
                    src={row.image}
                    alt={row.imageName}
                    onClick={() => showModal(row.image, row.imageName)}
                  />
                  <span className="tooltip">Click to view</span>
                </td>
                <td
                  className="copy-content"
                  onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
                  onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}
                  onClick={(e) => handleCopyContent(e, row.content, row.contentName)}
                >
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
        <div id="imageModal" className="modal open" onMouseMove={handleModalMouseMove} onClick={closeModal}>
          <span id="closeModal" className="close" onClick={closeModal}>&times;</span>
          <a
            id="downloadLink"
            href={modalData.imageSrc}
            download={modalData.imageName}
            onClick={(e) => handleDownloadImage(e, modalData.imageSrc, modalData.imageName)}
          >
            <img className="modal-content" id="modalImage" src={modalData.imageSrc} alt={modalData.imageName} />
            <span className="tooltip" ref={modalTooltipRef}>Click to download</span>
          </a>
        </div>
      )}
    </div>
  );
}

export default App;