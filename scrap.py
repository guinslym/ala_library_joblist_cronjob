import requests
import json
from pprint import pprint
import os
import sys
from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy import create_engine

Base = declarative_base()


from bs4 import BeautifulSoup


# constants and Utilities
absolute_url = lambda link:'https://joblist.ala.org' + link

def main():
    with open("index.html") as fp:
        soup = BeautifulSoup(fp, 'lxml')

    job_summaries = soup.find_all("div",class_="job-summary-top-left")

    for job in job_summaries[0:3]:
        #retrieve the Link
        link = job.a['href']
        url = absolute_url(link)
        # print(url)
        result = requests.get(url)
        if result.status_code == 200:
            content = result.content
        content
        soup = BeautifulSoup(content, 'lxml')
        summary_div = soup.find('div', class_='job-data-basics')
        job_list = summary_div.find_all('li')

        #create a dictionnary
        my_dict = dict()
        my_dict['link'] = url

        for li in job_list:
            if li.label.text.strip() == 'Location: '.strip():
                my_dict['location'] = li.span.text.strip()
            elif li.label.text.strip() == 'Job ID: '.strip():
                my_dict['job_id'] = li.span.text.strip()
            elif li.label.text.strip() == 'Posted: '.strip():
                my_dict['posted'] = li.span.text.strip()
            elif li.label.text.strip() == 'Position Title: '.strip():
                my_dict['position_title'] = li.span.text.strip()
            elif li.label.text.strip() == 'Company Name: '.strip():
                my_dict['company_name'] = li.span.text.strip()
            elif li.label.text.strip() == 'Library Type: '.strip():
                my_dict['library_type'] = li.span.text.strip()
            elif li.label.text.strip() == 'Job Category: '.strip():
                my_dict['job_category'] = li.span.text.strip()
            elif li.label.text.strip() == 'Job Type: '.strip():
                my_dict['job_type'] = li.span.text.strip()
            elif li.label.text.strip() == 'Job Duration: '.strip():
                my_dict['job_duration'] = li.span.text.strip()
            elif li.label.text.strip() == 'Min Education: '.strip():
                my_dict['min_education'] = li.span.text.strip()
            elif li.label.text.strip() == 'Min Experience: '.strip():
                my_dict['min_experience'] = li.span.text.strip()
            elif li.label.text.strip() == 'Required Travel: '.strip():
                my_dict['required_travel'] = li.span.text.strip()
            else:
                pass

        pprint(my_dict)
        #find the description:
        description = soup.find('div', class_='generic-details-text').extract()
        try:
            company_info = soup.find('div', class_='company-info clearfix').extract()
        except AttributeError:
            company_info = None

        my_dict['description'] = description
        my_dict['company_info'] = company_info

        return my_dict


class Job(Base):
    __tablename__ = 'job'
    # Here we define columns for the table address.
    # Notice that each column is also a normal Python instance attribute.
    id = Column(Integer, primary_key=True)
    location = Column(String(50), nullable=True)
    job_id = Column(String(20), nullable=True)
    position_title = Column(String(50), nullable=True)
    company_name = Column(String(60), nullable=True)
    library_type = Column(String(60), nullable=True)
    job_category = Column(String(60), nullable=True)
    job_type = Column(String(60), nullable=True)
    job_duration = Column(String(50), nullable=True)
    min_education = Column(String(50), nullable=True)
    min_experience = Column(String(50), nullable=True)
    required_travel = Column(String(20), nullable=True)
    posted = Column(String(40), nullable=True)


class Description(Base):
    __tablename__ = 'description'
    # Here we define columns for the table address.
    # Notice that each column is also a normal Python instance attribute.
    id = Column(Integer, primary_key=True)
    description = Text()
    company_info = Text()
    person_id = Column(Integer, ForeignKey('job.id'))
    person = relationship(Job)


engine = create_engine('sqlite:///library_jobs.db')

Base.metadata.create_all(engine)
