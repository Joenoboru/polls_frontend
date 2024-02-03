import React, { useState, useEffect } from 'react';
import './PollList.css';
import Chart from 'chart.js/auto';

const PollList = () => {
  const [polls, setPolls] = useState([]);
  const [selectedPollId, setSelectedPollId] = useState(null);
  const [poll, setPoll] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const closeModal = () => {
    setShowModal(false);
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/polls');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setPolls(data);
      } catch (error) {
        console.error('Error fetching polls:', error);
      }
    };

    fetchPolls();
  }, []);

  useEffect(() => {
    if (poll) {
      const totalVotes = poll.totalVotes;
      const data = poll.options.map(option => option.votes / totalVotes * 100);
      const doughnutCanvas = document.getElementById('doughnutChart');
      if (doughnutCanvas) {
        const doughnutCtx = doughnutCanvas.getContext('2d');
        const doughnutChart = new Chart(doughnutCtx, {
          type: 'doughnut',
          data: {
            labels: poll.options.map(option => option.label),
            datasets: [{
              data: data,
              backgroundColor: ['#e54e0e', '#24278e'],
              cutout: '50%',
            }],
          },
          options: {
            plugins: {
              legend: {
                display: false,
              }
            },
          },
        });
        return () => {
          doughnutChart.destroy();
        };
      }
    }
  }, [poll]);

  const handlePollClick = async (pollId) => {
    setSelectedPollId(pollId);
    try {
      const response = await fetch(`http://localhost:3001/api/poll/${pollId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const pollData = await response.json();
      setPoll(pollData);

      setShowModal(true);
    } catch (error) {
      console.error('Error fetching poll:', error);
    }
  };

  const handleVote = async (optionId) => {
    try {
      //發送投票
      const voteResponse = await fetch('http://localhost:3001/api/poll/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionId }),
      });

      if (!voteResponse.ok) {
        throw new Error(`Failed to vote. Status: ${voteResponse.status}`);
      }

      // 更新投票後的資料
      const updatedResponse = await fetch(`http://localhost:3001/api/poll/${poll.id}`);

      if (!updatedResponse.ok) {
        throw new Error(`Failed to fetch updated poll. Status: ${updatedResponse.status}`);
      }

      const updatedPoll = await updatedResponse.json();
      setPoll(updatedPoll);
    } catch (error) {
      console.error('Error handling vote:', error);
    }
  };

  return (
    <div>
      <ul>
        {polls && polls.map(poll => (
          <li key={poll.id} onClick={() => handlePollClick(poll.id)} className={selectedPollId === poll.id ? 'selected' : ''}>
            <img src="/poll_picture1.png" alt="poll_picture1" />
            <div className="poll-details">
              <p className="date">
                {new Date(poll.publishedDate * 1000).toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }).toUpperCase()}
              </p>
              <strong className="title">{poll.title}</strong>
            </div>
          </li>
        ))}
      </ul>
      {showModal && poll && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={stopPropagation}>
            <div className="header-content">
              <h2>Today's Poll</h2>
              <p className="poll-title">{poll.title}</p>
              <p className="poll-publishedDate">{new Date(poll.publishedDate * 1000).toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }).toUpperCase()}
              </p>
            </div>
            <div className="body-content">
              <ul>
                {poll.options.map(option => (
                  <li key={option.id}>
                    <button onClick={() => handleVote(option.id)}>{option.label}</button>
                  </li>
                ))}
              </ul>
              <div className="chart-container">
                <canvas id="doughnutChart"></canvas>
              </div>
            </div>
            <p style={{ textAlign: 'left' }}>Total number of votes recorded: {poll.totalVotes}</p>
            <button className="close-btn" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollList;
