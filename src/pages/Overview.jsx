import React from 'react';
import Sidebar from '../components/Sidebar';
import '../Overview.css';
import StatCard from '../components/StatCard';
import HeaderActions from '../components/HeaderActions';
import OverviewMap from '../components/map/OverviewMap';

const cards = [
	{
		title: 'Active Patients',
		percentage: '+12%',
		icon: '/card1-img.svg',
		value: '120',
	},
	{
		title: 'Active Alerts',
		percentage: '+5%',
		icon: '/card2-img.svg',
		value: '8',
	},
	{
		title: 'Unread Messages',
		percentage: '+20%',
		icon: '/card3-img.svg',
		value: '32',
	},
];

// Sample patient data with emergency contact
const patientWithEmergency = {
	name: 'John Doe',
	emergencyContact: {
		name: 'Sarah Doe',
		phone: '+1 (555) 123-4567'
	},
	// This would be the current location of the patient with the seizure
	location: [51.505, -0.09]
};

const Overview = () => {
	return (
		<div className="overview-container">
			<Sidebar />
			<div className="overview-content">
				<div className="overview-header">
					<h2 className="overview-title">
						Overview
					</h2>

					{/* Use the HeaderActions component instead of duplicated search and notification */}
					<HeaderActions />
				</div>

				<div className="card-grid">
					{cards.map((card, index) => (
						<StatCard
							key={index}
							title={card.title}
							percentage={card.percentage}
							icon={card.icon}
							value={card.value}
						/>
					))}
				</div>
				
				{/* Map Legend - Separate from map container */}
				<div className="map-legend-section">
					<div className="map-label-row">
						<span className="map-title">Ubaha Locator</span>
						<span className="map-dash seizure-dash">–</span>
						<span className="map-seizure">Seizure</span>
						<span className="map-dash no-seizure-dash">–</span>
						<span className="map-no-seizure">No Seizure</span>
					</div>
				</div>
				
				{/* Map Container - Separate from legend */}
				<div className="map-container-section">
					<OverviewMap />
				</div>
			</div>
		</div>
	);
};

export default Overview;
